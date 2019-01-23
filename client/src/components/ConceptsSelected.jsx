import React from 'react';
import axios from 'axios';

import SearchModal from './SearchModal.jsx';

import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    // float: 'right',
    // padding: '10px'
  },
  toggleButton: {
    float: 'right',
    marginTop: '5px'
  },
  conceptsSelectedElement: {
    position: 'relative',
    width: '420px',
    textAlign: 'center'
  },
  addButton: {
    // position: 'absolute',
    // right: '70px',
    // top: '-38px'
    display: 'inline-block'
  },
  conceptList: {
    fontSize: '130%',
    display: 'flex' ,
    flexFlow: 'row wrap',
    justifyContent: 'center'
  },
  concept: {
    width: '210px',
    listStyleType: 'none',
    cursor: 'pointer',
  },
});

class ConceptsSelected extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      conceptsSelected: [],
      conceptsSelectedOpen: false,
      searchModalOpen: false
    };
  }

  getConceptsSelected = async () => {
    axios.get('/api/conceptsSelected', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token')},
    }).then(res => {
      this.setState({
        isLoaded: true,
        conceptsSelected: res.data
      })
    })
    .catch(error => {
      this.setState({
        isLoaded: true,
        error: error
      });
    });
  }

  componentDidMount = async () => {
    await this.getConceptsSelected();
  }

  toggleConceptsSelected = () => {
    this.setState({
      conceptsSelectedOpen: !this.state.conceptsSelectedOpen
    });
  }

  openSearchModel = () => {
    this.setState({
      searchModalOpen: true
    });
  }

  closeSearchModel = () => {
    this.setState({
      searchModalOpen: false
    });
  }

  // adds a concept to conceptsSelected
  selectConcept = (conceptId) => {
    const body = {
      'id': conceptId,
      'checked': true
    }
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    }
    axios.post('/api/updateConceptsSelected', body, config).then(async res => {
      this.closeSearchModel();
      this.setState({
        isLoaded: false
      });
      await this.getConceptsSelected();
    }).catch(error => {
      this.closeSearchModel();
      console.log(error);
      if (error.response) {
        console.log(error.response.data.detail);
      }
    })
  }

  // Closes the ConceptsSelected Drawer, opens the DialogModal
  handleConceptClick = (concept) => {
    this.setState({
      conceptsSelectedOpen: false
    });
    this.props.handleConceptClick(concept);
  }

  render() {
    const { classes } = this.props;

    let conceptsSelectedElement = <div></div>;
    if (!this.state.isLoaded) {
      conceptsSelectedElement = <div>Loading...</div>;
    } else {
      conceptsSelectedElement = (
        <div className={classes.conceptsSelectedElement}>
          <Button
            className={classes.addButton}
            variant="contained"
            color="primary"
            aria-label="Add"
            onClick={this.openSearchModel}
          >
            <AddIcon />
          </Button>
          <div className={classes.conceptList}>
            {this.state.conceptsSelected.map(concept => (
              <li
                key={concept.id}
                className={classes.concept}
                onClick={() => this.handleConceptClick(concept)}
              >
                {concept.name}
                <br />
                <img
                  src={"/api/conceptImages/"+concept.id}
                  alt="Could not be downloaded"
                  height="50"
                  width="50"
                />
              </li>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={classes.root}>
        <SearchModal
          inputHandler={this.selectConcept}
          open={this.state.searchModalOpen}
          handleClose={this.closeSearchModel}
        />
        <Button
          className={classes.toggleButton}
          variant="contained"
          color="primary"
          onClick={this.toggleConceptsSelected}
        >
          Toggle Concepts Selected
        </Button>
        <Drawer
          anchor="right"
          open={this.state.conceptsSelectedOpen}
          onClose={this.toggleConceptsSelected}
        >
          {conceptsSelectedElement}
        </Drawer>
      </div>
    );
  }
}

export default withStyles(styles)(ConceptsSelected);
