import React from 'react';
import { _ } from 'meteor/underscore';
import classnames from 'classnames';
import BaseComponent from './BaseComponent.js';

export default class Item extends BaseComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const { keys } = this.props;

    const renderedKeys = keys.map(key => (
      <div className="key-wrapper" key={key.key}>
        <div className="key">
          <span className="name">{key.name}</span>
          <span className="value">{key.value}</span>
        </div>
      </div>
    ))

    return (
      <div className="item">
        {renderedKeys}
      </div>
    );
  }
}

Item.propTypes = {
  keys: React.PropTypes.array
};
