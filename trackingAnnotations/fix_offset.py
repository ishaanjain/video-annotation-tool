from skimage.measure import compare_ssim
import imutils
import cv2
from pgdb import connect
import boto3
import os
from dotenv import load_dotenv
from PIL import Image
import numpy as np
from multiprocessing import Pool


# Load environment variables
load_dotenv(dotenv_path="../.env")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET = os.getenv('AWS_S3_BUCKET_NAME')
s3 = boto3.client('s3', aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)
S3_ANNOTATION_FOLDER = os.getenv("AWS_S3_BUCKET_ANNOTATIONS_FOLDER")
S3_VIDEO_FOLDER = os.getenv('AWS_S3_BUCKET_VIDEOS_FOLDER')

# connect to db
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# video/image properties
VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080

# Generator to iterate through video frames


def iter_from_middle(lst):
    try:
        middle = math.ceil(len(lst)/2)
        yield middle, lst[middle]

        for shift in range(1, middle + 1):
            left = middle - shift
            right = middle + shift
            yield left, lst[left]
            yield right, lst[right]

    except IndexError:  # occures on lst[len(lst)] or for empty list
        # raise StopIteration
        return


def fix_offset(annotation):
    con = connect(database=DB_NAME, host=DB_HOST,
                  user=DB_USER, password=DB_PASSWORD)
    cursor = con.cursor()

    # get video name
    cursor.execute("SELECT filename FROM videos WHERE id=%s",
                   (str(annotation.videoid),))
    video_name = cursor.fetchone()[0]

    # grab video stream
    url = s3.generate_presigned_url('get_object',
                                    Params={'Bucket': S3_BUCKET,
                                            'Key': S3_VIDEO_FOLDER + str(video_name)},
                                    ExpiresIn=100)
    cap = cv2.VideoCapture(url)
    fps = cap.get(cv2.CAP_PROP_FPS)

    # search within +- search range seconds of original, +- frames from original annotation
    frames = 40
    search_seconds_range = frames / fps

    # initialize video for grabbing frames before annotation
    cap.set(0, (annotation.timeinvideo-search_seconds_range)
            * 1000)  # tell video to start at 'start'-1 time

    imgs = []
    times = []
    for i in range(math.ceil(fps*search_seconds_range * 2)):
        check, img = cap.read()
        if not check:
            print("end of video reached")
            break
        time = cap.get(cv2.CAP_PROP_POS_MSEC)
        times.append(time)
        imgs.append(img)
    cap.release()

    # get s3 image
    try:
        obj = s3.get_object(
            Bucket=S3_BUCKET,
            Key=S3_ANNOTATION_FOLDER + annotation.image
        )
    except:
        # print("Annotation missing image.")
        con.close()
        return
    img = Image.open(obj['Body'])
    img = np.asarray(img)
    img = img[:, :, :3]
    img = img[:, :, ::-1]
    img = cv2.resize(img, (VIDEO_WIDTH, VIDEO_HEIGHT))

    best_score = 0
    for index, video_frame in iter_from_middle(imgs):
        if index == len(imgs):
            continue
        (score, _) = compare_ssim(
            img, video_frame, full=True, multichannel=True)
        if score > best_score:
            best_score = score
        if best_score > .92:
            cursor.execute(
                '''
          UPDATE annotations
          SET framenum=%d, timeinvideo=%f, originalid=NULL
          WHERE id= %d;''',
                (round(times[index]*fps/1000), times[index]/1000, annotation.id,))
            con.commit()
            con.close()
            return
    print(
        f'Failed on annnotation {annotation.id} with best score {best_score}')
    cursor.execute(
        "UPDATE annotations SET unsure=TRUE WHERE id=%d;", (annotation.id,))
    con.commit()
    con.close()


if __name__ == "__main__":
    con = connect(database=DB_NAME, host=DB_HOST,
                  user=DB_USER, password=DB_PASSWORD)
    cursor = con.cursor()
    cursor.execute(
        '''
        SELECT id, timeinvideo, videoid, image
        FROM annotations
        WHERE unsure=True AND framenum IS null
        '''
    )
    with Pool() as p:
        p.map(fix_offset, map(lambda x: (x.id, x.timeinvideo, x.videoid, x.image), cursor.fetchall())
