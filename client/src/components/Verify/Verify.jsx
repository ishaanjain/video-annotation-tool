import React, { Component } from 'react';
import axios from 'axios';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import { Button, Typography } from '@material-ui/core';

import VerifySelection from './VerifySelection';
import VerifyAnnotations from './VerifyAnnotations';

const styles = theme => ({
  button: {
    margin: theme.spacing()
  },
  resetContainer: {
    padding: theme.spacing(3)
  },
  list: {
    width: '100%',
    backgroundColor: theme.palette.background.paper
  },
  item: {
    display: 'inline',
    paddingTop: 0,
    width: '1300px',
    height: '730px',
    paddingLeft: 0
  },
  img: {
    padding: theme.spacing(3),
    width: '1280px',
    height: '720px'
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gridGap: theme.spacing(3)
  },
  paper: {
    padding: theme.spacing(5)
  }
});

class Verify extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAnnotationCollections: [],
      selectedUsers: [],
      selectedVideos: [],
      selectedConcepts: [],
      selectedUnsure: false,
      selectedTrackingFirst: false,
      index: 0
    };
  }

  toggleSelection = async () => {
    const { selectedAnnotationCollections } = this.state;
    const selectionMounted = JSON.parse(
      localStorage.getItem('selectionMounted')
    );
    let annotations = [];
    if (!selectionMounted) {
      localStorage.setItem('selectionMounted', !selectionMounted);
      localStorage.setItem('noAnnotations', false);
      this.resetState(
        this.setState({
          selectionMounted: !selectionMounted,
          // eslint-disable-next-line react/no-unused-state
          noAnnotations: false
        })
      );
    } else {
      if (selectedAnnotationCollections.length) {
        annotations = await this.getAnnotationsFromCollection();
      } else {
        annotations = await this.getAnnotations();
      }
      if (annotations.length < 1) {
        localStorage.setItem('noAnnotations', true);
        localStorage.setItem('selectionMounted', !selectionMounted);
        this.setState({
          // eslint-disable-next-line react/no-unused-state
          noAnnotations: true,
          selectionMounted: !selectionMounted
        });
      } else {
        localStorage.setItem('selectionMounted', !selectionMounted);
        localStorage.setItem('verifyAnnotation', JSON.stringify(annotations));
        this.setState({
          selectionMounted: !selectionMounted
        });
      }
    }
  };

  getAnnotationCollections = async () => {
    return axios
      .get(`/api/collections/annotations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  getAnnotationsFromCollection = async () => {
    const { selectedAnnotationCollections } = this.state;
    return axios
      .get(
        `/api/annotations/collections?collectionids=${selectedAnnotationCollections}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      )
      .then(res => {
        return res.data;
      })
      .catch(error => {
        console.log(error);
      });
  };

  getUsers = async () => {
    return axios
      .get(`/api/users?noAi=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  getVideos = async () => {
    const { selectedUsers } = this.state;
    return axios
      .get(`/api/annotations/verified`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: {
          verifiedOnly: '-1',
          selectedUsers
        }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  getVideoCollections = async () => {
    return axios
      .get(`/api/collections/videos`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  getConcepts = async () => {
    const { selectedUsers, selectedVideos } = this.state;

    return axios
      .get(`/api/annotations/verified`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          verifiedOnly: '-1',
          selectedUsers,
          selectedVideos
        }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  getConceptCollections = async () => {
    return axios
      .get(`/api/collections/concepts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  getUnsure = async () => {
    const { selectedUsers, selectedVideos, selectedConcepts } = this.state;

    return axios
      .get(`/api/annotations/verified`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          verifiedOnly: '-1',
          selectedUsers,
          selectedVideos,
          selectedConcepts
        }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  getAnnotations = async () => {
    const {
      selectedTrackingFirst,
      selectedUsers,
      selectedVideos,
      selectedConcepts,
      selectedUnsure
    } = this.state;

    return axios
      .get(`/api/annotations/verified`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          verifiedOnly: selectedTrackingFirst ? '1' : '-1',
          selectedUsers,
          selectedVideos,
          selectedConcepts,
          selectedUnsure,
          selectedTrackingFirst
        }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
      });
  };

  selectUser = user => {
    const { selectedUsers } = this.state;
    this.setState({
      selectedUsers: selectedUsers.concat(user)
    });
  };

  handleChange = type => value => {
    this.setState({
      [type]: value
    });
  };

  handleChangeSwitch = type => event => {
    this.setState({
      [type]: event.target.checked
    });
  };

  handleChangeList = (stateVariable, type) => event => {
    if (!stateVariable.includes(event.target.value)) {
      this.setState({
        [type]: stateVariable.concat(event.target.value)
      });
    } else {
      this.setState({
        [type]: stateVariable.filter(typeid => typeid !== event.target.value)
      });
    }
  };

  handleSelectAll = (data, dataSelected, stepInfo) => {
    const selected = dataSelected;
    data.forEach(row => {
      if (row.id) {
        if (!selected.includes(row.id.toString())) {
          selected.push(row.id.toString());
        }
      }
    });
    this.setState({
      [stepInfo]: selected
    });
  };

  handleUnselectAll = stepInfo => {
    this.setState({
      [stepInfo]: []
    });
  };

  resetStep = step => {
    switch (step) {
      case 0:
        this.setState({
          selectedAnnotationCollections: []
        });
        return;
      case 1:
        this.setState({
          selectedUsers: []
        });
        return;
      case 2:
        this.setState({
          selectedVideos: []
        });
        return;
      case 3:
        this.setState({
          selectedConcepts: []
        });
        return;
      case 4:
        this.setState({
          selectedUnsure: false,
          selectedTrackingFirst: false
        });
        break;
      default:
    }
  };

  resetState = callback => {
    this.setState(
      {
        selectedAnnotationCollections: [],
        selectedUsers: [],
        selectedVideos: [],
        selectedConcepts: [],
        selectedUnsure: false,
        selectedTrackingFirst: false,
        index: 0
      },
      localStorage.setItem('curIndex', 0),
      callback
    );
  };

  handleNext = callback => {
    const index = JSON.parse(localStorage.getItem('curIndex'));
    // const { index } = this.state;
    localStorage.setItem('curIndex', index + 1);
    this.setState(
      {
        index: index + 1
      },
      callback
    );
  };

  resetLocalStorage = () => {
    this.resetState(
      this.setState({
        selectionMounted: true,
        index: 0,
        // eslint-disable-next-line react/no-unused-state
        noAnnotations: false
      })
    );
    localStorage.setItem('selectionMounted', true);
    localStorage.setItem('curIndex', 0);
    localStorage.removeItem('verifyAnnotation');
    localStorage.removeItem('noAnnotations');
  };

  render() {
    const { classes } = this.props;
    const {
      selectionMounted,
      selectedAnnotationCollections,
      selectedUsers,
      selectedVideos,
      selectedConcepts,
      selectedUnsure,
      selectedTrackingFirst,
      index
    } = this.state;
    const selectionMountedLS = JSON.parse(
      localStorage.getItem('selectionMounted')
    );
    const annotations = JSON.parse(localStorage.getItem('verifyAnnotation'));
    const noAnnotationsLS = JSON.parse(localStorage.getItem('noAnnotations'));

    let selection = '';
    if (selectionMountedLS) {
      selection = (
        <VerifySelection
          selectedAnnotationCollections={selectedAnnotationCollections}
          selectedUsers={selectedUsers}
          selectedVideos={selectedVideos}
          selectedConcepts={selectedConcepts}
          selectedUnsure={selectedUnsure}
          selectedTrackingFirst={selectedTrackingFirst}
          getAnnotationCollections={this.getAnnotationCollections}
          getAnnotationsFromCollection={this.getAnnotationsFromCollection}
          getUsers={this.getUsers}
          getVideos={this.getVideos}
          getVideoCollections={this.getVideoCollections}
          getConcepts={this.getConcepts}
          getConceptCollections={this.getConceptCollections}
          getUnsure={this.getUnsure}
          handleChangeSwitch={this.handleChangeSwitch}
          handleChange={this.handleChange}
          handleChangeList={this.handleChangeList}
          resetStep={this.resetStep}
          resetState={this.resetState}
          toggleSelection={this.toggleSelection}
          selectUser={this.selectUser}
          handleSelectAll={this.handleSelectAll}
          handleUnselectAll={this.handleUnselectAll}
        />
      );
    } else if (noAnnotationsLS) {
      selection = (
        <Paper square elevation={0} className={classes.resetContainer}>
          <Typography>All Tracking Videos Verified</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              this.resetState();
              this.setState({
                selectionMounted: !selectionMounted,
                // eslint-disable-next-line react/no-unused-state
                noAnnotations: false
              });
              localStorage.setItem('selectionMounted', !selectionMounted);
              localStorage.setItem('noAnnotations', false);
            }}
          >
            Reset
          </Button>
        </Paper>
      );
    } else {
      selection = (
        <Paper square elevation={0} className={classes.resetContainer}>
          <VerifyAnnotations
            annotation={annotations[index]}
            index={index}
            handleNext={this.handleNext}
            toggleSelection={this.toggleSelection}
            size={JSON.parse(localStorage.getItem('verifyAnnotation')).length}
            tracking={selectedTrackingFirst}
            resetLocalStorage={this.resetLocalStorage}
          />
        </Paper>
      );
    }

    return <React.Fragment>{selection}</React.Fragment>;
  }
}

export default withStyles(styles)(Verify);
