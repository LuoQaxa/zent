import React, { Component } from 'react';
import assign from 'object-assign';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import forEach from 'lodash/forEach';
import find from 'lodash/find';
import Popover from '../popover';
import Tabs from '../tabs';

const PopoverContent = Popover.Content;
const withPopover = Popover.withPopover;

const TabPanel = Tabs.TabPanel;
const noop = () => {};

class PopoverClickTrigger extends Popover.Trigger.Click {
  getTriggerProps(child) {
    return {
      onClick: evt => {
        if (this.props.contentVisible) {
          this.props.close();
        } else {
          this.props.open();
        }
        this.triggerEvent(child, 'onClick', evt);
      }
    };
  }
}

class Cascader extends Component {
  constructor(props) {
    super(props);

    this.state = assign(
      {
        value: [],
        onChangeValue: [],
        activeId: 1,
        open: false
      },
      props
    );
  }

  componentWillMount() {
    this.resetCascaderValue();
  }

  resetCascaderValue() {
    let onChangeValue = [];
    let { value } = this.state;

    let { options } = this.props;

    if (options && options.length > 0 && value && value.length > 0) {
      forEach(value, id => {
        let nextOption = find(options, { id });
        options = nextOption.children;
        onChangeValue.push({
          id: nextOption.id,
          name: nextOption.name
        });
      });
    }

    this.setState({
      onChangeValue
    });
  }

  onShow() {
    this.setState({
      open: true
    });
  }

  onClose() {
    this.setState({
      open: false
    });
  }

  onTabChange(id) {
    this.setState({
      activeId: id
    });
  }

  renderCascaderItems(items, stage, popover) {
    let { prefix } = this.props;

    let { value } = this.state;

    let cascaderItems = items.map(item => {
      let cascaderItemCls = classnames({
        [`${prefix}-cascader-list__item-link`]: true,
        active: item.id === value[stage - 1]
      });

      return (
        <span className={`${prefix}-cascader-list__item`} key={item.id}>
          <span
            className={cascaderItemCls}
            onClick={() => this.clickHandler(item, stage, popover)}
          >
            {item.name}
          </span>
        </span>
      );
    });

    return (
      <div className="zent-cascader-list">
        {cascaderItems}
      </div>
    );
  }

  clickHandler = (item, stage, popover) => {
    let { value, onChangeValue } = this.state;

    let { changeOnSelect, onChange } = this.props;

    value = value.slice(0, stage - 1);
    value.push(item.id);

    onChangeValue = onChangeValue.slice(0, stage - 1);
    onChangeValue.push({
      id: item.id,
      name: item.name
    });

    let obj = {
      value
    };
    let hasClose = false;

    if (item.children) {
      obj.activeId = ++stage;
    } else {
      hasClose = true;
      obj.onChangeValue = onChangeValue;
      onChange(onChangeValue);
      popover.close();
    }

    if (changeOnSelect) {
      if (!hasClose) {
        onChange(onChangeValue);
      } else {
        obj.onChangeValue = onChangeValue;
      }
    }

    this.setState(obj);
  };

  recursiveNextOptions(options, id) {
    if (options && options.length > 0) {
      let currOptions = find(options, { id });
      if (currOptions && currOptions.children) {
        return currOptions.children;
      }
    }
  }

  renderPanels(popover) {
    let PanelEls = [];
    let tabIndex = 1;
    let { options } = this.props;

    let { value } = this.state;

    PanelEls.push(
      <TabPanel tab="省份" id={tabIndex} key={tabIndex}>
        {this.renderCascaderItems(options, tabIndex, popover)}
      </TabPanel>
    );

    if (value && value.length > 0) {
      for (let i = 0; i < value.length; i++) {
        tabIndex++;
        options = this.recursiveNextOptions(options, value[i]);
        if (options) {
          PanelEls.push(
            <TabPanel tab="省份" id={tabIndex} key={tabIndex}>
              {this.renderCascaderItems(options, tabIndex, popover)}
            </TabPanel>
          );
        }
      }
    }

    return PanelEls;
  }

  render() {
    let self = this;

    let { prefix, className, popClass, placeholder } = this.props;

    let { onChangeValue, open, activeId } = this.state;

    let cascaderCls = classnames({
      [`${prefix}-cascader-select`]: true,
      open
    });

    const CascaderPopoverContent = withPopover(({ popover }) => {
      return (
        <div className={`${prefix}-cascader-select__popup`}>
          <Tabs
            activeId={activeId}
            onTabChange={self.onTabChange.bind(self)}
            className={`${prefix}-cascader-tabs`}
          >
            {self.renderPanels(popover)}
          </Tabs>
        </div>
      );
    });

    let cascaderWrapCls = classnames({
      [`${prefix}-cascader-select-wrap`]: true,
      [className]: true
    });

    let cascaderValue = placeholder;
    if (onChangeValue && onChangeValue.length > 0) {
      cascaderValue = onChangeValue.map(valueItem => {
        return valueItem.name;
      });
      cascaderValue = cascaderValue.join(' / ');
    }

    return (
      <div className={cascaderWrapCls}>
        <Popover
          className={popClass}
          position={Popover.Position.BottomLeft}
          onShow={this.onShow.bind(this)}
          onClose={this.onClose.bind(this)}
        >
          <PopoverClickTrigger>
            <div className={cascaderCls}>
              <div className={`${prefix}-cascader-select__text`}>
                {cascaderValue}
              </div>
            </div>
          </PopoverClickTrigger>
          <PopoverContent>
            <CascaderPopoverContent />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
}

Cascader.propTypes = {
  prefix: PropTypes.string,
  className: PropTypes.string,
  popClass: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.array,
  options: PropTypes.array,
  placeholder: PropTypes.string,
  changeOnSelect: PropTypes.bool
};

Cascader.defaultProps = {
  prefix: 'zent',
  className: '',
  popClass: 'zent-popover__cascader',
  onChange: noop,
  value: [],
  options: [],
  placeholder: '请选择',
  changeOnSelect: false
};

export default Cascader;
