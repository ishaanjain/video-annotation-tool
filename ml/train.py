import json
import os

import keras
import tensorflow as tf
import boto3
import multiprocessing
from dotenv import load_dotenv
from tensorflow.python.client import device_lib
from keras_retinanet import models
from keras_retinanet import losses
from keras.utils import multi_gpu_model
from keras.callbacks import ModelCheckpoint, EarlyStopping
from keras_retinanet.callbacks import RedirectModel

from utils.timer import timer
from preprocessing.annotation_generator import AnnotationGenerator
from callbacks.progress import Progress
from callbacks.tensorboard import TensorboardLog


config_path = "../config.json"
load_dotenv(dotenv_path="../.env")
with open(config_path) as config_buffer:
    config = json.loads(config_buffer.read())['ml']

IMAGE_FOLDER = config['image_folder']
BATCH_SIZE = config['batch_size']
WEIGHTS_PATH = config['weights_path']

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET = os.getenv('AWS_S3_BUCKET_NAME')
S3_BUCKET_WEIGHTS_FOLDER = os.getenv('AWS_S3_BUCKET_WEIGHTS_FOLDER')

s3 = boto3.client('s3', aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY)


def _create_model(num_classes):
    # Suggested to initialize model on cpu before turning into a
    # multi_gpu model to save gpu memory
    with tf.device('/cpu:0'):
        model = models.backbone('resnet50').retinanet(num_classes=num_classes)
        model.load_weights(WEIGHTS_PATH, by_name=True, skip_mismatch=True)

    gpus = len([i for i in device_lib.list_local_devices() if i.device_type == 'GPU'])

    if gpus > 1:
        return multi_gpu_model(model, gpus=gpus)
    return model


def _get_callbacks(model,
                   model_name,
                   min_examples,
                   epochs,
                   collection_ids,
                   steps_per_epoch):
    # Save models that are improvements
    checkpoint = ModelCheckpoint(WEIGHTS_PATH,
                                 monitor='val_loss',
                                 save_best_only=True
                                 )

    checkpoint = RedirectModel(checkpoint, model)

    # Stops training if val_loss stops improving
    stopping = EarlyStopping(monitor='val_loss', min_delta=0, patience=10)

    # Every epoch upload tensorboard logs to the S3 bucket
    log_callback = TensorboardLog(
        model_name=model_name,
        min_examples=min_examples,
        epochs=epochs,
        collection_ids=collection_ids
    )

    # Save tensorboard logs to appropriate folder
    tensorboard_callback = keras.callbacks.TensorBoard(
        log_dir=f'./logs/{log_callback.id}',
        batch_size=BATCH_SIZE,
    )

    # Every batch and epoch update a database table with the current progress
    progress_callback = Progress(
        steps_per_epoch=steps_per_epoch,
        num_epochs=epochs
    )

    return [checkpoint, stopping, progress_callback, log_callback, tensorboard_callback]


def _upload_weights(model_name):
    s3.upload_file(WEIGHTS_PATH, S3_BUCKET, S3_BUCKET_WEIGHTS_FOLDER + model_name + ".h5")


def _get_num_workers():
    return multiprocessing.cpu_count()


@timer("training")
def train_model(concepts, model_name, collection_ids, min_examples,
                epochs, download_data=True):

    model = _create_model(len(concepts))
    num_workers = _get_num_workers()

    model.compile(
        loss={
            'regression': losses.smooth_l1(),
            'classification': losses.focal()
        },
        optimizer=keras.optimizers.adam(lr=1e-5, clipnorm=0.001)
    )

    collection_generator = AnnotationGenerator(
        collection_ids=collection_ids,
        min_examples=min_examples,
        classes=concepts
    )

    train_generator = collection_generator.flow_from_s3(
        image_folder=IMAGE_FOLDER,
        subset='training',
        batch_size=BATCH_SIZE
    )

    test_generator = collection_generator.flow_from_s3(
        image_folder=IMAGE_FOLDER,
        subset='validation',
        batch_size=BATCH_SIZE
    )

    callbacks = _get_callbacks(
        model=model,
        model_name=model_name,
        collection_ids=collection_ids,
        min_examples=min_examples,
        epochs=epochs,
        steps_per_epoch=len(train_generator)
    )

    model.fit_generator(
        train_generator,
        epochs=epochs,
        callbacks=callbacks,
        validation_data=test_generator,
        use_multiprocessing=True,
        workers=num_workers,
        verbose=2
    )

    _upload_weights(model_name)
