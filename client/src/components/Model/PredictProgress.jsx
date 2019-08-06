import React, { Component } from 'react';
import axios from 'axios';

import { withStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { Typography } from '@material-ui/core';

const styles = () => ({
  trainStatus: {
    marginBottom: 0
  },
  progressBar: {
    height: '8px'
  },
  progressText: {
    marginBottom: '5px'
  }
});

class PredictProgress extends Component {
  constructor(props) {
    super(props);

    this.state = {
      running: false
    };

    this.loadProgressInfo();
    this.loadProgressInfo = this.loadProgressInfo.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.loadProgressInfo(), 500);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  loadProgressInfo = async () => {
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };
    try {
      const ret = await axios.get(`/api/models/progress/predict`, config);
      if (ret) {
        const { data } = ret;
        const totalVideos = data.length;
        if (data.length === 0) {
          this.setState({
            running: false
          });
        } else {
          this.setState({
            totalVideos,
            data: ret.data,
            running: true
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  getStatus = status => {
    if (status === 0) {
      return 'Resizing';
    }
    if (status === 1) {
      return 'Predicting';
    }
    if (status === 2) {
      return 'Generating';
    }
    return '';
  };

  getProgress = (framenum, totalframe) => {
    // var progress = (status * (100 / totalSteps)) + (framenum / totalframe) * (100 / totalSteps);
    const progress = (framenum / totalframe) * 100;
    return progress;
  };

  render() {
    const { classes, className } = this.props;
    const { running, totalVideos, data } = this.state;

    if (running === false) {
      return <div> </div>;
    }

    return (
      <div className={className}>
        <h3 className={classes.trainStatus}> Predicting Status: </h3>
        {running ? (
          <div>
            <h4 className={classes.progressText}>{totalVideos} to predict</h4>
            {data.map(row => (
              <div key={row.videoid}>
                <h4 className={classes.progressText}>Videoid: {row.videoid}</h4>
                <Typography>
                  {this.getStatus(row.status)} at {row.framenum} out of{' '}
                  {row.totalframe}
                </Typography>
                <LinearProgress
                  className={classes.progressBar}
                  variant="determinate"
                  value={this.getProgress(
                    row.framenum,
                    row.totalframe,
                    row.status
                  )}
                  // value={(row.framenum / row.totalframe) * 100}
                  color="secondary"
                />
              </div>
            ))}
          </div>
        ) : (
          <h4>Not Predicting</h4>
        )}
      </div>
    );
  }
}

export default withStyles(styles)(PredictProgress);
