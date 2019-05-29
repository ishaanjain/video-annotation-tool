import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import { Checkbox } from "@material-ui/core";

const styles = theme => ({
  root: {
    display: "flex"
  },
  formControl: {
    margin: theme.spacing.unit * 3
  },
  group: {
    margin: `${theme.spacing.unit}px 0`
  }
});

class VerifySelectUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: []
    };
  }

  componentDidMount = async () => {
    let users = await this.props.getUsers();

    this.setState({
      users: users
    });
  };

  render() {
    const { classes, value, handleChange } = this.props;

    return (
      <div className={classes.root}>
        <FormControl component="fieldset" className={classes.formControl}>
          <FormGroup
            aria-label="User"
            name="user"
            className={classes.group}
            value={value}
            onChange={handleChange}
          >
            <FormControlLabel
              key={-2}
              value={"-2"}
              control={<Checkbox color="primary" />}
              label="All users"
              checked={this.props.value.includes("-2")}
            />
            {this.state.users.map(user => (
              <FormControlLabel
                key={user.id}
                value={user.id.toString()}
                control={<Checkbox color="primary" />}
                label={user.username}
                checked={this.props.value.includes(user.id.toString())}
              />
            ))}
          </FormGroup>
        </FormControl>
      </div>
    );
  }
}

VerifySelectUser.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(VerifySelectUser);
