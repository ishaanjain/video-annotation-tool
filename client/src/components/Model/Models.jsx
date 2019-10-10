import React, { Component } from 'react';
import axios from 'axios';
import { withStyles } from '@material-ui/core/styles';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Table from '@material-ui/core/Table';
import Swal from 'sweetalert2/src/sweetalert2';
import { Typography, Button } from '@material-ui/core';

import Dialog from '@material-ui/core/Dialog';
import TableCell from '@material-ui/core/TableCell';

import ModelsTable from './ModelsTable';
import CreateModel from './CreateModel';

const styles = theme => ({
  root: {
    margins: 'auto',
    padding: '20px 12%'
  }
});

const CustomTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    fontSize: 14
  },
  body: {
    fontSize: 14
  }
}))(TableCell);

class Models extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: [],
      videoModalOpen: false,
      createOpen: false,
      trainOpen: false,
      predictOpen: false,
      infoOpen: false,
      selectedModel: '',
      versionOpen: false,
      launchedTB: null,
      loadingTB: null
    };
  }
  formatDate = version => {
    let d = new Date(version);
    return d.toUTCString().replace(' GMT', '');
  };

  componentDidMount = () => {
    this.loadExistingModels();
    this.loadRunningTensorboard();
  };

  loadExistingModels = () => {
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };
    axios
      .get(`/api/models`, config)
      .then(res => {
        this.setState({
          models: res.data
        });
      })
      .catch(error => {
        console.log('Error in get /api/models');
        console.log(error);
        if (error.response) {
          console.log(error.response.data.detail);
        }
      });
  };

  loadRunningTensorboard = () => {
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };

    axios
      .get('/api/models/tensorboard/', config)
      .then(res => {
        this.setState({ launchedTB: parseInt(res.data.id, 10) });
      })
      .catch(error => {
        console.log('Error in get /api/models/tensorboard/');
        console.log(error);
        if (error.response) {
          console.log(error.response.data.detail);
        }
      });
  };

  openTensorboard = () => {
    const { launched } = this.state;

    if (launched !== null) {
      if (process.env.NODE_ENV === 'production') {
        const domain = window.location.hostname.replace(
          /(https?:\/\/)?(www.)?/i,
          ''
        );
        setTimeout(() => {
          window.open(`https://tensorboard.${domain}`, '_blank');
        }, 500);
      } else {
        window.open('http://localhost:6008', '_blank');
      }
    }
  };

  stopTensorboard = () => {
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };

    axios
      .delete(`/api/models/tensorboard/`, config)
      .then(() => {
        this.setState({
          launched: null
        });
      })
      .catch(error => {
        console.log('Error in get /api/models/tensorboard/');
        console.log(error);
        if (error.response) {
          console.log(error.response.data.detail);
        }
      });
  };

  launchTensorboard = id => {
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };

    const body = {
      command: 'launch'
    };

    this.setState({ loadingId: id });

    axios
      .post(`/api/models/tensorboard/${id}`, body, config)
      .then(() => {
        this.setState({ launched: id });
        this.openTensorboard();
      })
      .catch(error => {
        console.log('Error in get /api/models/tensorboard/');
        console.log(error);
        if (error.response) {
          console.log(error.response.data.detail);
        }
      })
      .finally(() => this.setState({ loadingId: null }));
  };

  handleCloseInfo = () => {
    this.setState({
      infoOpen: false
    });
  };

  handleOpenInfo = model => {
    this.setState({
      infoOpen: true,
      selectedModel: model
    });
  };

  deleteModel = async model => {
    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      data: {
        model
      }
    };
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async result => {
      if (result.value) {
        try {
          await axios.delete('/api/models', config);
          Swal.fire('Deleted!', 'Video has been deleted.', 'success');
          this.loadExistingModels();
        } catch (error) {
          Swal.fire(error, '', 'error');
        }
      }
    });
  };

  toggleStateVariable = (condition, variable) => {
    this.setState({
      [variable]: condition
    });
  };

  handleSelectVersion = (id, model) => {
    const { models } = this.state;
    let selectedModel = models.find(m => m.name === model);

    selectedModel.version_selected = id;

    this.setState({ models });
  };

  handleClickVideo = async (id, videos) => {
    let currentVideo = await videos.find(video => video.id === id);
    this.setState({
      videoModalOpen: true,
      currentVideo
    });
  };

  render() {
    const { classes } = this.props;
    const {
      models,
      videoModalOpen,
      currentVideo,
      infoOpen,
      selectedModel,
      createOpen,
      trainOpen,
      predictOpen,
      versionOpen
    } = this.state;

    if (!models) {
      return <Typography style={{ margin: '20px' }}>Loading...</Typography>;
    }
    return (
      <div className={classes.root}>
        <Button
          style={{ marginBottom: '20px' }}
          variant="contained"
          color="primary"
          onClick={() => this.toggleStateVariable(true, 'createOpen')}
        >
          Create Model
        </Button>
        <CreateModel
          createOpen={createOpen}
          toggleStateVariable={this.toggleStateVariable}
        />
        <ModelsTable
          models={models}
          handleSelectVersion={this.handleSelectVersion}
          handleOpenInfo={this.handleOpenInfo}
          deleteModel={this.deleteModel}
          formatDate={this.formatDate}
          videoModalOpen={videoModalOpen}
          handleClickVideo={this.handleClickVideo}
          toggleStateVariable={this.toggleStateVariable}
          currentVideo={currentVideo}
          trainOpen={trainOpen}
          predictOpen={predictOpen}
          versionOpen={versionOpen}
          launchTensorboard={this.launchTensorboard}
        />
        {infoOpen && (
          <Dialog onClose={this.handleCloseInfo} open={infoOpen}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <CustomTableCell>Concepts</CustomTableCell>
                  <CustomTableCell>ConceptIDs</CustomTableCell>
                  <CustomTableCell>Verification Videos</CustomTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <CustomTableCell align="right">
                    {selectedModel.concepts.join(', ')}
                  </CustomTableCell>
                  <CustomTableCell align="right">
                    {selectedModel.conceptsid.toString()}
                  </CustomTableCell>
                  <CustomTableCell>
                    {selectedModel.verificationvideos
                      ? selectedModel.verificationvideos.toString()
                      : 'NON'}
                  </CustomTableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Dialog>
        )}
      </div>
    );
  }
}

export default withStyles(styles)(Models);
