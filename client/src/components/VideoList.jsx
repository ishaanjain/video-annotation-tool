import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import Description from '@material-ui/icons/Description';
import { withStyles } from '@material-ui/core/styles';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import VideoMetadata from './VideoMetadata.jsx';

const styles = theme => ({
  root: {
    // float: 'right',
    // padding: '10px'
  },
  drawer: {
    // height: '1000px',
    // padding: '15px',
    width: '550px',
    overflow: 'auto'
  },
  toggleButton: {
    marginTop: '5px'
  }
});

class VideoList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      videoListOpen: false,
      startedListOpen: false,
      unwatchedListOpen: false,
      watchedListOpen: false,
      inProgressListOpen: false,
      descriptionOpen: false,
      videoid: null
    };
  }

  toggle = (list) => {
    this.setState({
      [list]: !this.state[list]
    });
  }

  //Methods for video meta data
  openVideoMetadata = (event, videoid) => {
    event.stopPropagation()
    this.setState({
      descriptionOpen: true,
      videoid: videoid
    })
  }

  inputHandler = () => {
    console.log('Input');
  }

  closeVideoMetadata = () => {
    this.setState({
      descriptionOpen: false
    });
  }

  render () {
    const {
      classes,
      handleVideoClick,
      startedVideos,
      unwatchedVideos,
      watchedVideos,
      inProgressVideos
    } = this.props;
    const {
      startedListOpen,
      unwatchedListOpen,
      watchedListOpen,
      inProgressListOpen
    } = this.state;

    return (
      <div className={classes.root}>
        <Button
          className={classes.toggleButton}
          variant="contained"
          color="primary"
          onClick={() => this.toggle("videoListOpen")}
        >
          Toggle Video List
        </Button>

        <Drawer
          anchor="left"
          open={this.state.videoListOpen}
          onClose={() => this.toggle('videoListOpen')}
        >
        <div className={classes.drawer}>

          <ListItem button onClick={() => this.toggle("startedListOpen")}>
            <ListItemText inset primary="My In Progress Videos" />
            {startedListOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={startedListOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {startedVideos.map(video => (
                <ListItem
                  button key={video.id}
                  style={video.count>1?{backgroundColor: 'red'}:{}}
                  onClick={() => handleVideoClick(video, 'startedVideos')}
                >
                  <ListItemText primary={video.id + '. ' + video.filename} />
                  <IconButton>
                    <Description
                      onClick={
                        (event) => this.openVideoMetadata(event, video.id)
                      }
                    />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          <ListItem button onClick={() => this.toggle("unwatchedListOpen")}>
            <ListItemText inset primary="Unwatched Videos" />
            {unwatchedListOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={unwatchedListOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {unwatchedVideos.map(video => (
                <ListItem
                  button key={video.id}
                  onClick={() => handleVideoClick(video, 'unwatchedVideos')}
                >
                  <ListItemText primary={video.id + '. ' + video.filename} />
                  <IconButton>
                    <Description
                      onClick={
                        (event) => this.openVideoMetadata(event, video.id)
                      }
                    />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          <ListItem button onClick={() => this.toggle("watchedListOpen")}>
            <ListItemText inset primary="Annotated Videos" />
            {watchedListOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={watchedListOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {watchedVideos.map(video => (
                <ListItem
                  button key={video.id}
                  onClick={() => handleVideoClick(video, 'watchedVideos')}
                >
                  <ListItemText primary={video.id + '. ' + video.filename} />
                  <IconButton>
                    <Description
                      onClick={
                        (event) => this.openVideoMetadata(event, video.id)
                      }
                    />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Collapse>

          <ListItem button onClick={() => this.toggle("inProgressListOpen")}>
            <ListItemText inset primary="All In Progress Videos" />
            {inProgressListOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={inProgressListOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {inProgressVideos.map(video => (
                <ListItem
                  button key={video.id}
                  onClick={() => handleVideoClick(video, 'inProgressVideos')}
                >
                  <ListItemText primary={video.id + '. ' + video.filename} />
                  <IconButton>
                    <Description
                      onClick={
                        (event) => this.openVideoMetadata(event, video.id)
                      }
                    />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </div>
        </Drawer>
        {this.state.descriptionOpen &&
          <VideoMetadata
            open={true /* The DialogModal 'openness' is controlled through
              boolean logic rather than by passing in a variable as an
              attribute. This is to force DialogModal to unmount when it closes
              so that its state is reset. This also prevents the accidental
              double submission bug, by implicitly reducing the transition time
              of DialogModal to zero. */}
            handleClose={this.closeVideoMetadata}
            videoid={this.state.videoid}
          />
        }
      </div>
    );
  }
}

VideoList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(VideoList);
