/**
 * React v0.9.0
 */
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.React=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule AutoFocusMixin
 * @typechecks static-only
 */

"use strict";

var AutoFocusMixin = {
  componentDidMount: function() {
    if (this.props.autoFocus) {
      this.getDOMNode().focus();
    }
  }
};

module.exports = AutoFocusMixin;

},{}],2:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CSSProperty
 */

"use strict";

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
  columnCount: true,
  fillOpacity: true,
  flex: true,
  flexGrow: true,
  flexShrink: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true
};

/**
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */
function prefixKey(prefix, key) {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */
var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

// Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.
Object.keys(isUnitlessNumber).forEach(function(prop) {
  prefixes.forEach(function(prefix) {
    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
  });
});

/**
 * Most style properties can be unset by doing .style[prop] = '' but IE8
 * doesn't like doing that with shorthand properties so for the properties that
 * IE8 breaks on, which are listed here, we instead unset each of the
 * individual properties. See http://bugs.jquery.com/ticket/12385.
 * The 4-value 'clock' properties like margin, padding, border-width seem to
 * behave without any problems. Curiously, list-style works too without any
 * special prodding.
 */
var shorthandPropertyExpansions = {
  background: {
    backgroundImage: true,
    backgroundPosition: true,
    backgroundRepeat: true,
    backgroundColor: true
  },
  border: {
    borderWidth: true,
    borderStyle: true,
    borderColor: true
  },
  borderBottom: {
    borderBottomWidth: true,
    borderBottomStyle: true,
    borderBottomColor: true
  },
  borderLeft: {
    borderLeftWidth: true,
    borderLeftStyle: true,
    borderLeftColor: true
  },
  borderRight: {
    borderRightWidth: true,
    borderRightStyle: true,
    borderRightColor: true
  },
  borderTop: {
    borderTopWidth: true,
    borderTopStyle: true,
    borderTopColor: true
  },
  font: {
    fontStyle: true,
    fontVariant: true,
    fontWeight: true,
    fontSize: true,
    lineHeight: true,
    fontFamily: true
  }
};

var CSSProperty = {
  isUnitlessNumber: isUnitlessNumber,
  shorthandPropertyExpansions: shorthandPropertyExpansions
};

module.exports = CSSProperty;

},{}],3:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CSSPropertyOperations
 * @typechecks static-only
 */

"use strict";

var CSSProperty = require("./CSSProperty");

var dangerousStyleValue = require("./dangerousStyleValue");
var escapeTextForBrowser = require("./escapeTextForBrowser");
var hyphenate = require("./hyphenate");
var memoizeStringOnly = require("./memoizeStringOnly");

var processStyleName = memoizeStringOnly(function(styleName) {
  return escapeTextForBrowser(hyphenate(styleName));
});

/**
 * Operations for dealing with CSS properties.
 */
var CSSPropertyOperations = {

  /**
   * Serializes a mapping of style properties for use as inline styles:
   *
   *   > createMarkupForStyles({width: '200px', height: 0})
   *   "width:200px;height:0;"
   *
   * Undefined values are ignored so that declarative programming is easier.
   *
   * @param {object} styles
   * @return {?string}
   */
  createMarkupForStyles: function(styles) {
    var serialized = '';
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      if (styleValue != null) {
        serialized += processStyleName(styleName) + ':';
        serialized += dangerousStyleValue(styleName, styleValue) + ';';
      }
    }
    return serialized || null;
  },

  /**
   * Sets the value for multiple styles on a node.  If a value is specified as
   * '' (empty string), the corresponding style property will be unset.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */
  setValueForStyles: function(node, styles) {
    var style = node.style;
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = dangerousStyleValue(styleName, styles[styleName]);
      if (styleValue) {
        style[styleName] = styleValue;
      } else {
        var expansion = CSSProperty.shorthandPropertyExpansions[styleName];
        if (expansion) {
          // Shorthand property that IE8 won't like unsetting, so unset each
          // component to placate it
          for (var individualStyleName in expansion) {
            style[individualStyleName] = '';
          }
        } else {
          style[styleName] = '';
        }
      }
    }
  }

};

module.exports = CSSPropertyOperations;

},{"./CSSProperty":2,"./dangerousStyleValue":94,"./escapeTextForBrowser":96,"./hyphenate":107,"./memoizeStringOnly":116}],4:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ChangeEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactUpdates = require("./ReactUpdates");
var SyntheticEvent = require("./SyntheticEvent");

var isEventSupported = require("./isEventSupported");
var isTextInputElement = require("./isTextInputElement");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: keyOf({onChange: null}),
      captured: keyOf({onChangeCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topChange,
      topLevelTypes.topClick,
      topLevelTypes.topFocus,
      topLevelTypes.topInput,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyUp,
      topLevelTypes.topSelectionChange
    ]
  }
};

/**
 * For IE shims
 */
var activeElement = null;
var activeElementID = null;
var activeElementValue = null;
var activeElementValueProp = null;

/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem) {
  return (
    elem.nodeName === 'SELECT' ||
    (elem.nodeName === 'INPUT' && elem.type === 'file')
  );
}

var doesChangeEventBubble = false;
if (ExecutionEnvironment.canUseDOM) {
  // See `handleChange` comment below
  doesChangeEventBubble = isEventSupported('change') && (
    !('documentMode' in document) || document.documentMode > 8
  );
}

function manualDispatchChangeEvent(nativeEvent) {
  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    activeElementID,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(event);

  // If change and propertychange bubbled, we'd just bind to it like all the
  // other events and have it go through ReactEventTopLevelCallback. Since it
  // doesn't, we manually listen for the events and so we have to enqueue and
  // process the abstract event manually.
  //
  // Batching is necessary here in order to ensure that all event handlers run
  // before the next rerender (including event handlers attached to ancestor
  // elements instead of directly on the input). Without this, controlled
  // components don't work properly in conjunction with event bubbling because
  // the component is rerendered and the value reverted before all the event
  // handlers can run. See https://github.com/facebook/react/issues/708.
  ReactUpdates.batchedUpdates(runEventInBatch, event);
}

function runEventInBatch(event) {
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue();
}

function startWatchingForChangeEventIE8(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElement.attachEvent('onchange', manualDispatchChangeEvent);
}

function stopWatchingForChangeEventIE8() {
  if (!activeElement) {
    return;
  }
  activeElement.detachEvent('onchange', manualDispatchChangeEvent);
  activeElement = null;
  activeElementID = null;
}

function getTargetIDForChangeEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topChange) {
    return topLevelTargetID;
  }
}
function handleEventsForChangeEventIE8(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForChangeEventIE8();
    startWatchingForChangeEventIE8(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForChangeEventIE8();
  }
}


/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  // IE9 claims to support the input event but fails to trigger it when
  // deleting text, so we ignore its input events
  isInputEventSupported = isEventSupported('input') && (
    !('documentMode' in document) || document.documentMode > 9
  );
}

/**
 * (For old IE.) Replacement getter/setter for the `value` property that gets
 * set on the active element.
 */
var newValueProp =  {
  get: function() {
    return activeElementValueProp.get.call(this);
  },
  set: function(val) {
    // Cast to a string so we can do equality checks.
    activeElementValue = '' + val;
    activeElementValueProp.set.call(this, val);
  }
};

/**
 * (For old IE.) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
function startWatchingForValueChange(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElementValue = target.value;
  activeElementValueProp = Object.getOwnPropertyDescriptor(
    target.constructor.prototype,
    'value'
  );

  Object.defineProperty(activeElement, 'value', newValueProp);
  activeElement.attachEvent('onpropertychange', handlePropertyChange);
}

/**
 * (For old IE.) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
function stopWatchingForValueChange() {
  if (!activeElement) {
    return;
  }

  // delete restores the original property definition
  delete activeElement.value;
  activeElement.detachEvent('onpropertychange', handlePropertyChange);

  activeElement = null;
  activeElementID = null;
  activeElementValue = null;
  activeElementValueProp = null;
}

/**
 * (For old IE.) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
function handlePropertyChange(nativeEvent) {
  if (nativeEvent.propertyName !== 'value') {
    return;
  }
  var value = nativeEvent.srcElement.value;
  if (value === activeElementValue) {
    return;
  }
  activeElementValue = value;

  manualDispatchChangeEvent(nativeEvent);
}

/**
 * If a `change` event should be fired, returns the target's ID.
 */
function getTargetIDForInputEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topInput) {
    // In modern browsers (i.e., not IE8 or IE9), the input event is exactly
    // what we want so fall through here and trigger an abstract event
    return topLevelTargetID;
  }
}

// For IE8 and IE9.
function handleEventsForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // In IE8, we can capture almost all .value changes by adding a
    // propertychange handler and looking for events with propertyName
    // equal to 'value'
    // In IE9, propertychange fires for most input events but is buggy and
    // doesn't fire when text is deleted, but conveniently, selectionchange
    // appears to fire in all of the remaining cases so we catch those and
    // forward the event if the value has changed
    // In either case, we don't want to call the event handler if the value
    // is changed from JS so we redefine a setter for `.value` that updates
    // our activeElementValue variable, allowing us to ignore those changes
    //
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForValueChange();
    startWatchingForValueChange(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForValueChange();
  }
}

// For IE8 and IE9.
function getTargetIDForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topSelectionChange ||
      topLevelType === topLevelTypes.topKeyUp ||
      topLevelType === topLevelTypes.topKeyDown) {
    // On the selectionchange event, the target is just document which isn't
    // helpful for us so just check activeElement instead.
    //
    // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
    // propertychange on the first input event after setting `value` from a
    // script and fires only keydown, keypress, keyup. Catching keyup usually
    // gets it and catching keydown lets us fire an event for the first
    // keystroke if user does a key repeat (it'll be a little delayed: right
    // before the second keystroke). Other input methods (e.g., paste) seem to
    // fire selectionchange normally.
    if (activeElement && activeElement.value !== activeElementValue) {
      activeElementValue = activeElement.value;
      return activeElementID;
    }
  }
}


/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  return (
    elem.nodeName === 'INPUT' &&
    (elem.type === 'checkbox' || elem.type === 'radio')
  );
}

function getTargetIDForClickEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topClick) {
    return topLevelTargetID;
  }
}

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
var ChangeEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    var getTargetIDFunc, handleEventFunc;
    if (shouldUseChangeEvent(topLevelTarget)) {
      if (doesChangeEventBubble) {
        getTargetIDFunc = getTargetIDForChangeEvent;
      } else {
        handleEventFunc = handleEventsForChangeEventIE8;
      }
    } else if (isTextInputElement(topLevelTarget)) {
      if (isInputEventSupported) {
        getTargetIDFunc = getTargetIDForInputEvent;
      } else {
        getTargetIDFunc = getTargetIDForInputEventIE;
        handleEventFunc = handleEventsForInputEventIE;
      }
    } else if (shouldUseClickEvent(topLevelTarget)) {
      getTargetIDFunc = getTargetIDForClickEvent;
    }

    if (getTargetIDFunc) {
      var targetID = getTargetIDFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
      if (targetID) {
        var event = SyntheticEvent.getPooled(
          eventTypes.change,
          targetID,
          nativeEvent
        );
        EventPropagators.accumulateTwoPhaseDispatches(event);
        return event;
      }
    }

    if (handleEventFunc) {
      handleEventFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
    }
  }

};

module.exports = ChangeEventPlugin;

},{"./EventConstants":14,"./EventPluginHub":16,"./EventPropagators":19,"./ExecutionEnvironment":20,"./ReactUpdates":70,"./SyntheticEvent":77,"./isEventSupported":109,"./isTextInputElement":111,"./keyOf":115}],5:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ClientReactRootIndex
 * @typechecks
 */

"use strict";

var nextReactRootIndex = 0;

var ClientReactRootIndex = {
  createReactRootIndex: function() {
    return nextReactRootIndex++;
  }
};

module.exports = ClientReactRootIndex;

},{}],6:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CompositionEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactInputSelection = require("./ReactInputSelection");
var SyntheticCompositionEvent = require("./SyntheticCompositionEvent");

var getTextContentAccessor = require("./getTextContentAccessor");
var keyOf = require("./keyOf");

var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
var START_KEYCODE = 229;

var useCompositionEvent = (
  ExecutionEnvironment.canUseDOM &&
  'CompositionEvent' in window
);

// In IE9+, we have access to composition events, but the data supplied
// by the native compositionend event may be incorrect. In Korean, for example,
// the compositionend event contains only one character regardless of
// how many characters have been composed since compositionstart.
// We therefore use the fallback data while still using the native
// events as triggers.
var useFallbackData = (
  !useCompositionEvent ||
  'documentMode' in document && document.documentMode > 8
);

var topLevelTypes = EventConstants.topLevelTypes;
var currentComposition = null;

// Events and their corresponding property names.
var eventTypes = {
  compositionEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionEnd: null}),
      captured: keyOf({onCompositionEndCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionEnd,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  },
  compositionStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionStart: null}),
      captured: keyOf({onCompositionStartCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionStart,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  },
  compositionUpdate: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionUpdate: null}),
      captured: keyOf({onCompositionUpdateCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topCompositionUpdate,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyPress,
      topLevelTypes.topKeyUp,
      topLevelTypes.topMouseDown
    ]
  }
};

/**
 * Translate native top level events into event types.
 *
 * @param {string} topLevelType
 * @return {object}
 */
function getCompositionEventType(topLevelType) {
  switch (topLevelType) {
    case topLevelTypes.topCompositionStart:
      return eventTypes.compositionStart;
    case topLevelTypes.topCompositionEnd:
      return eventTypes.compositionEnd;
    case topLevelTypes.topCompositionUpdate:
      return eventTypes.compositionUpdate;
  }
}

/**
 * Does our fallback best-guess model think this event signifies that
 * composition has begun?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackStart(topLevelType, nativeEvent) {
  return (
    topLevelType === topLevelTypes.topKeyDown &&
    nativeEvent.keyCode === START_KEYCODE
  );
}

/**
 * Does our fallback mode think that this event is the end of composition?
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 */
function isFallbackEnd(topLevelType, nativeEvent) {
  switch (topLevelType) {
    case topLevelTypes.topKeyUp:
      // Command keys insert or clear IME input.
      return (END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1);
    case topLevelTypes.topKeyDown:
      // Expect IME keyCode on each keydown. If we get any other
      // code we must have exited earlier.
      return (nativeEvent.keyCode !== START_KEYCODE);
    case topLevelTypes.topKeyPress:
    case topLevelTypes.topMouseDown:
    case topLevelTypes.topBlur:
      // Events are not possible without cancelling IME.
      return true;
    default:
      return false;
  }
}

/**
 * Helper class stores information about selection and document state
 * so we can figure out what changed at a later date.
 *
 * @param {DOMEventTarget} root
 */
function FallbackCompositionState(root) {
  this.root = root;
  this.startSelection = ReactInputSelection.getSelection(root);
  this.startValue = this.getText();
}

/**
 * Get current text of input.
 *
 * @return {string}
 */
FallbackCompositionState.prototype.getText = function() {
  return this.root.value || this.root[getTextContentAccessor()];
};

/**
 * Text that has changed since the start of composition.
 *
 * @return {string}
 */
FallbackCompositionState.prototype.getData = function() {
  var endValue = this.getText();
  var prefixLength = this.startSelection.start;
  var suffixLength = this.startValue.length - this.startSelection.end;

  return endValue.substr(
    prefixLength,
    endValue.length - suffixLength - prefixLength
  );
};

/**
 * This plugin creates `onCompositionStart`, `onCompositionUpdate` and
 * `onCompositionEnd` events on inputs, textareas and contentEditable
 * nodes.
 */
var CompositionEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    var eventType;
    var data;

    if (useCompositionEvent) {
      eventType = getCompositionEventType(topLevelType);
    } else if (!currentComposition) {
      if (isFallbackStart(topLevelType, nativeEvent)) {
        eventType = eventTypes.compositionStart;
      }
    } else if (isFallbackEnd(topLevelType, nativeEvent)) {
      eventType = eventTypes.compositionEnd;
    }

    if (useFallbackData) {
      // The current composition is stored statically and must not be
      // overwritten while composition continues.
      if (!currentComposition && eventType === eventTypes.compositionStart) {
        currentComposition = new FallbackCompositionState(topLevelTarget);
      } else if (eventType === eventTypes.compositionEnd) {
        if (currentComposition) {
          data = currentComposition.getData();
          currentComposition = null;
        }
      }
    }

    if (eventType) {
      var event = SyntheticCompositionEvent.getPooled(
        eventType,
        topLevelTargetID,
        nativeEvent
      );
      if (data) {
        // Inject data generated from fallback path into the synthetic event.
        // This matches the property of native CompositionEventInterface.
        event.data = data;
      }
      EventPropagators.accumulateTwoPhaseDispatches(event);
      return event;
    }
  }
};

module.exports = CompositionEventPlugin;

},{"./EventConstants":14,"./EventPropagators":19,"./ExecutionEnvironment":20,"./ReactInputSelection":52,"./SyntheticCompositionEvent":75,"./getTextContentAccessor":105,"./keyOf":115}],7:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMChildrenOperations
 * @typechecks static-only
 */

"use strict";

var Danger = require("./Danger");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

var getTextContentAccessor = require("./getTextContentAccessor");

/**
 * The DOM property to use when setting text content.
 *
 * @type {string}
 * @private
 */
var textContentAccessor = getTextContentAccessor();

/**
 * Inserts `childNode` as a child of `parentNode` at the `index`.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} index Index at which to insert the child.
 * @internal
 */
function insertChildAt(parentNode, childNode, index) {
  var childNodes = parentNode.childNodes;
  if (childNodes[index] === childNode) {
    return;
  }
  // If `childNode` is already a child of `parentNode`, remove it so that
  // computing `childNodes[index]` takes into account the removal.
  if (childNode.parentNode === parentNode) {
    parentNode.removeChild(childNode);
  }
  if (index >= childNodes.length) {
    parentNode.appendChild(childNode);
  } else {
    parentNode.insertBefore(childNode, childNodes[index]);
  }
}

/**
 * Sets the text content of `node` to `text`.
 *
 * @param {DOMElement} node Node to change
 * @param {string} text New text content
 */
var updateTextContent;
if (textContentAccessor === 'textContent') {
  updateTextContent = function(node, text) {
    node.textContent = text;
  };
} else {
  updateTextContent = function(node, text) {
    // In order to preserve newlines correctly, we can't use .innerText to set
    // the contents (see #1080), so we empty the element then append a text node
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    if (text) {
      var doc = node.ownerDocument || document;
      node.appendChild(doc.createTextNode(text));
    }
  };
}

/**
 * Operations for updating with DOM children.
 */
var DOMChildrenOperations = {

  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,

  updateTextContent: updateTextContent,

  /**
   * Updates a component's children by processing a series of updates. The
   * update configurations are each expected to have a `parentNode` property.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markupList List of markup strings.
   * @internal
   */
  processUpdates: function(updates, markupList) {
    var update;
    // Mapping from parent IDs to initial child orderings.
    var initialChildren = null;
    // List of children that will be moved or removed.
    var updatedChildren = null;

    for (var i = 0; update = updates[i]; i++) {
      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
        var updatedIndex = update.fromIndex;
        var updatedChild = update.parentNode.childNodes[updatedIndex];
        var parentID = update.parentID;

        initialChildren = initialChildren || {};
        initialChildren[parentID] = initialChildren[parentID] || [];
        initialChildren[parentID][updatedIndex] = updatedChild;

        updatedChildren = updatedChildren || [];
        updatedChildren.push(updatedChild);
      }
    }

    var renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);

    // Remove updated children first so that `toIndex` is consistent.
    if (updatedChildren) {
      for (var j = 0; j < updatedChildren.length; j++) {
        updatedChildren[j].parentNode.removeChild(updatedChildren[j]);
      }
    }

    for (var k = 0; update = updates[k]; k++) {
      switch (update.type) {
        case ReactMultiChildUpdateTypes.INSERT_MARKUP:
          insertChildAt(
            update.parentNode,
            renderedMarkup[update.markupIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.MOVE_EXISTING:
          insertChildAt(
            update.parentNode,
            initialChildren[update.parentID][update.fromIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.TEXT_CONTENT:
          updateTextContent(
            update.parentNode,
            update.textContent
          );
          break;
        case ReactMultiChildUpdateTypes.REMOVE_NODE:
          // Already removed by the for-loop above.
          break;
      }
    }
  }

};

module.exports = DOMChildrenOperations;

},{"./Danger":10,"./ReactMultiChildUpdateTypes":58,"./getTextContentAccessor":105}],8:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMProperty
 * @typechecks static-only
 */

/*jslint bitwise: true */

"use strict";

var invariant = require("./invariant");

var DOMPropertyInjection = {
  /**
   * Mapping from normalized, camelcased property names to a configuration that
   * specifies how the associated DOM property should be accessed or rendered.
   */
  MUST_USE_ATTRIBUTE: 0x1,
  MUST_USE_PROPERTY: 0x2,
  HAS_SIDE_EFFECTS: 0x4,
  HAS_BOOLEAN_VALUE: 0x8,
  HAS_POSITIVE_NUMERIC_VALUE: 0x10,

  /**
   * Inject some specialized knowledge about the DOM. This takes a config object
   * with the following properties:
   *
   * isCustomAttribute: function that given an attribute name will return true
   * if it can be inserted into the DOM verbatim. Useful for data-* or aria-*
   * attributes where it's impossible to enumerate all of the possible
   * attribute names,
   *
   * Properties: object mapping DOM property name to one of the
   * DOMPropertyInjection constants or null. If your attribute isn't in here,
   * it won't get written to the DOM.
   *
   * DOMAttributeNames: object mapping React attribute name to the DOM
   * attribute name. Attribute names not specified use the **lowercase**
   * normalized name.
   *
   * DOMPropertyNames: similar to DOMAttributeNames but for DOM properties.
   * Property names not specified use the normalized name.
   *
   * DOMMutationMethods: Properties that require special mutation methods. If
   * `value` is undefined, the mutation method should unset the property.
   *
   * @param {object} domPropertyConfig the config as described above.
   */
  injectDOMPropertyConfig: function(domPropertyConfig) {
    var Properties = domPropertyConfig.Properties || {};
    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {};
    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {};
    var DOMMutationMethods = domPropertyConfig.DOMMutationMethods || {};

    if (domPropertyConfig.isCustomAttribute) {
      DOMProperty._isCustomAttributeFunctions.push(
        domPropertyConfig.isCustomAttribute
      );
    }

    for (var propName in Properties) {
      ("production" !== "development" ? invariant(
        !DOMProperty.isStandardName[propName],
        'injectDOMPropertyConfig(...): You\'re trying to inject DOM property ' +
        '\'%s\' which has already been injected. You may be accidentally ' +
        'injecting the same DOM property config twice, or you may be ' +
        'injecting two configs that have conflicting property names.',
        propName
      ) : invariant(!DOMProperty.isStandardName[propName]));

      DOMProperty.isStandardName[propName] = true;

      var lowerCased = propName.toLowerCase();
      DOMProperty.getPossibleStandardName[lowerCased] = propName;

      var attributeName = DOMAttributeNames[propName];
      if (attributeName) {
        DOMProperty.getPossibleStandardName[attributeName] = propName;
      }

      DOMProperty.getAttributeName[propName] = attributeName || lowerCased;

      DOMProperty.getPropertyName[propName] =
        DOMPropertyNames[propName] || propName;

      var mutationMethod = DOMMutationMethods[propName];
      if (mutationMethod) {
        DOMProperty.getMutationMethod[propName] = mutationMethod;
      }

      var propConfig = Properties[propName];
      DOMProperty.mustUseAttribute[propName] =
        propConfig & DOMPropertyInjection.MUST_USE_ATTRIBUTE;
      DOMProperty.mustUseProperty[propName] =
        propConfig & DOMPropertyInjection.MUST_USE_PROPERTY;
      DOMProperty.hasSideEffects[propName] =
        propConfig & DOMPropertyInjection.HAS_SIDE_EFFECTS;
      DOMProperty.hasBooleanValue[propName] =
        propConfig & DOMPropertyInjection.HAS_BOOLEAN_VALUE;
      DOMProperty.hasPositiveNumericValue[propName] =
        propConfig & DOMPropertyInjection.HAS_POSITIVE_NUMERIC_VALUE;

      ("production" !== "development" ? invariant(
        !DOMProperty.mustUseAttribute[propName] ||
          !DOMProperty.mustUseProperty[propName],
        'DOMProperty: Cannot require using both attribute and property: %s',
        propName
      ) : invariant(!DOMProperty.mustUseAttribute[propName] ||
        !DOMProperty.mustUseProperty[propName]));
      ("production" !== "development" ? invariant(
        DOMProperty.mustUseProperty[propName] ||
          !DOMProperty.hasSideEffects[propName],
        'DOMProperty: Properties that have side effects must use property: %s',
        propName
      ) : invariant(DOMProperty.mustUseProperty[propName] ||
        !DOMProperty.hasSideEffects[propName]));
      ("production" !== "development" ? invariant(
        !DOMProperty.hasBooleanValue[propName] ||
          !DOMProperty.hasPositiveNumericValue[propName],
        'DOMProperty: Cannot have both boolean and positive numeric value: %s',
        propName
      ) : invariant(!DOMProperty.hasBooleanValue[propName] ||
        !DOMProperty.hasPositiveNumericValue[propName]));
    }
  }
};
var defaultValueCache = {};

/**
 * DOMProperty exports lookup objects that can be used like functions:
 *
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {

  ID_ATTRIBUTE_NAME: 'data-reactid',

  /**
   * Checks whether a property name is a standard property.
   * @type {Object}
   */
  isStandardName: {},

  /**
   * Mapping from lowercase property names to the properly cased version, used
   * to warn in the case of missing properties.
   * @type {Object}
   */
  getPossibleStandardName: {},

  /**
   * Mapping from normalized names to attribute names that differ. Attribute
   * names are used when rendering markup or with `*Attribute()`.
   * @type {Object}
   */
  getAttributeName: {},

  /**
   * Mapping from normalized names to properties on DOM node instances.
   * (This includes properties that mutate due to external factors.)
   * @type {Object}
   */
  getPropertyName: {},

  /**
   * Mapping from normalized names to mutation methods. This will only exist if
   * mutation cannot be set simply by the property or `setAttribute()`.
   * @type {Object}
   */
  getMutationMethod: {},

  /**
   * Whether the property must be accessed and mutated as an object property.
   * @type {Object}
   */
  mustUseAttribute: {},

  /**
   * Whether the property must be accessed and mutated using `*Attribute()`.
   * (This includes anything that fails `<propName> in <element>`.)
   * @type {Object}
   */
  mustUseProperty: {},

  /**
   * Whether or not setting a value causes side effects such as triggering
   * resources to be loaded or text selection changes. We must ensure that
   * the value is only set if it has changed.
   * @type {Object}
   */
  hasSideEffects: {},

  /**
   * Whether the property should be removed when set to a falsey value.
   * @type {Object}
   */
  hasBooleanValue: {},

  /**
   * Whether the property must be positive numeric or parse as a positive
   * numeric and should be removed when set to a falsey value.
   * @type {Object}
   */
  hasPositiveNumericValue: {},

  /**
   * All of the isCustomAttribute() functions that have been injected.
   */
  _isCustomAttributeFunctions: [],

  /**
   * Checks whether a property name is a custom attribute.
   * @method
   */
  isCustomAttribute: function(attributeName) {
    return DOMProperty._isCustomAttributeFunctions.some(
      function(isCustomAttributeFn) {
        return isCustomAttributeFn.call(null, attributeName);
      }
    );
  },

  /**
   * Returns the default property value for a DOM property (i.e., not an
   * attribute). Most default values are '' or false, but not all. Worse yet,
   * some (in particular, `type`) vary depending on the type of element.
   *
   * TODO: Is it better to grab all the possible properties when creating an
   * element to avoid having to create the same element twice?
   */
  getDefaultValueForProperty: function(nodeName, prop) {
    var nodeDefaults = defaultValueCache[nodeName];
    var testElement;
    if (!nodeDefaults) {
      defaultValueCache[nodeName] = nodeDefaults = {};
    }
    if (!(prop in nodeDefaults)) {
      testElement = document.createElement(nodeName);
      nodeDefaults[prop] = testElement[prop];
    }
    return nodeDefaults[prop];
  },

  injection: DOMPropertyInjection
};

module.exports = DOMProperty;

},{"./invariant":108}],9:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMPropertyOperations
 * @typechecks static-only
 */

"use strict";

var DOMProperty = require("./DOMProperty");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var memoizeStringOnly = require("./memoizeStringOnly");

function shouldIgnoreValue(name, value) {
  return value == null ||
    DOMProperty.hasBooleanValue[name] && !value ||
    DOMProperty.hasPositiveNumericValue[name] && (isNaN(value) || value < 1);
}

var processAttributeNameAndPrefix = memoizeStringOnly(function(name) {
  return escapeTextForBrowser(name) + '="';
});

if ("production" !== "development") {
  var reactProps = {
    children: true,
    dangerouslySetInnerHTML: true,
    key: true,
    ref: true
  };
  var warnedProperties = {};

  var warnUnknownProperty = function(name) {
    if (reactProps[name] || warnedProperties[name]) {
      return;
    }

    warnedProperties[name] = true;
    var lowerCasedName = name.toLowerCase();

    // data-* attributes should be lowercase; suggest the lowercase version
    var standardName = DOMProperty.isCustomAttribute(lowerCasedName) ?
      lowerCasedName : DOMProperty.getPossibleStandardName[lowerCasedName];

    // For now, only warn when we have a suggested correction. This prevents
    // logging too much when using transferPropsTo.
    if (standardName != null) {
      console.warn(
        'Unknown DOM property ' + name + '. Did you mean ' + standardName + '?'
      );
    }

  };
}

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {

  /**
   * Creates markup for the ID property.
   *
   * @param {string} id Unescaped ID.
   * @return {string} Markup string.
   */
  createMarkupForID: function(id) {
    return processAttributeNameAndPrefix(DOMProperty.ID_ATTRIBUTE_NAME) +
      escapeTextForBrowser(id) + '"';
  },

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function(name, value) {
    if (DOMProperty.isStandardName[name]) {
      if (shouldIgnoreValue(name, value)) {
        return '';
      }
      var attributeName = DOMProperty.getAttributeName[name];
      if (DOMProperty.hasBooleanValue[name]) {
        return escapeTextForBrowser(attributeName);
      }
      return processAttributeNameAndPrefix(attributeName) +
        escapeTextForBrowser(value) + '"';
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        return '';
      }
      return processAttributeNameAndPrefix(name) +
        escapeTextForBrowser(value) + '"';
    } else if ("production" !== "development") {
      warnUnknownProperty(name);
    }
    return null;
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (shouldIgnoreValue(name, value)) {
        this.deleteValueForProperty(node, name);
      } else if (DOMProperty.mustUseAttribute[name]) {
        node.setAttribute(DOMProperty.getAttributeName[name], '' + value);
      } else {
        var propName = DOMProperty.getPropertyName[name];
        if (!DOMProperty.hasSideEffects[name] || node[propName] !== value) {
          node[propName] = value;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        node.removeAttribute(DOMProperty.getAttributeName[name]);
      } else {
        node.setAttribute(name, '' + value);
      }
    } else if ("production" !== "development") {
      warnUnknownProperty(name);
    }
  },

  /**
   * Deletes the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForProperty: function(node, name) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, undefined);
      } else if (DOMProperty.mustUseAttribute[name]) {
        node.removeAttribute(DOMProperty.getAttributeName[name]);
      } else {
        var propName = DOMProperty.getPropertyName[name];
        var defaultValue = DOMProperty.getDefaultValueForProperty(
          node.nodeName,
          name
        );
        if (!DOMProperty.hasSideEffects[name] ||
            node[propName] !== defaultValue) {
          node[propName] = defaultValue;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.removeAttribute(name);
    } else if ("production" !== "development") {
      warnUnknownProperty(name);
    }
  }

};

module.exports = DOMPropertyOperations;

},{"./DOMProperty":8,"./escapeTextForBrowser":96,"./memoizeStringOnly":116}],10:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule Danger
 * @typechecks static-only
 */

/*jslint evil: true, sub: true */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createNodesFromMarkup = require("./createNodesFromMarkup");
var emptyFunction = require("./emptyFunction");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

var OPEN_TAG_NAME_EXP = /^(<[^ \/>]+)/;
var RESULT_INDEX_ATTR = 'data-danger-index';

/**
 * Extracts the `nodeName` from a string of markup.
 *
 * NOTE: Extracting the `nodeName` does not require a regular expression match
 * because we make assumptions about React-generated markup (i.e. there are no
 * spaces surrounding the opening tag and there is at least one attribute).
 *
 * @param {string} markup String of markup.
 * @return {string} Node name of the supplied markup.
 * @see http://jsperf.com/extract-nodename
 */
function getNodeName(markup) {
  return markup.substring(1, markup.indexOf(' '));
}

var Danger = {

  /**
   * Renders markup into an array of nodes. The markup is expected to render
   * into a list of root nodes. Also, the length of `resultList` and
   * `markupList` should be the same.
   *
   * @param {array<string>} markupList List of markup strings to render.
   * @return {array<DOMElement>} List of rendered nodes.
   * @internal
   */
  dangerouslyRenderMarkup: function(markupList) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyRenderMarkup(...): Cannot render markup in a Worker ' +
      'thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    var nodeName;
    var markupByNodeName = {};
    // Group markup by `nodeName` if a wrap is necessary, else by '*'.
    for (var i = 0; i < markupList.length; i++) {
      ("production" !== "development" ? invariant(
        markupList[i],
        'dangerouslyRenderMarkup(...): Missing markup.'
      ) : invariant(markupList[i]));
      nodeName = getNodeName(markupList[i]);
      nodeName = getMarkupWrap(nodeName) ? nodeName : '*';
      markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];
      markupByNodeName[nodeName][i] = markupList[i];
    }
    var resultList = [];
    var resultListAssignmentCount = 0;
    for (nodeName in markupByNodeName) {
      if (!markupByNodeName.hasOwnProperty(nodeName)) {
        continue;
      }
      var markupListByNodeName = markupByNodeName[nodeName];

      // This for-in loop skips the holes of the sparse array. The order of
      // iteration should follow the order of assignment, which happens to match
      // numerical index order, but we don't rely on that.
      for (var resultIndex in markupListByNodeName) {
        if (markupListByNodeName.hasOwnProperty(resultIndex)) {
          var markup = markupListByNodeName[resultIndex];

          // Push the requested markup with an additional RESULT_INDEX_ATTR
          // attribute.  If the markup does not start with a < character, it
          // will be discarded below (with an appropriate console.error).
          markupListByNodeName[resultIndex] = markup.replace(
            OPEN_TAG_NAME_EXP,
            // This index will be parsed back out below.
            '$1 ' + RESULT_INDEX_ATTR + '="' + resultIndex + '" '
          );
        }
      }

      // Render each group of markup with similar wrapping `nodeName`.
      var renderNodes = createNodesFromMarkup(
        markupListByNodeName.join(''),
        emptyFunction // Do nothing special with <script> tags.
      );

      for (i = 0; i < renderNodes.length; ++i) {
        var renderNode = renderNodes[i];
        if (renderNode.hasAttribute &&
            renderNode.hasAttribute(RESULT_INDEX_ATTR)) {

          resultIndex = +renderNode.getAttribute(RESULT_INDEX_ATTR);
          renderNode.removeAttribute(RESULT_INDEX_ATTR);

          ("production" !== "development" ? invariant(
            !resultList.hasOwnProperty(resultIndex),
            'Danger: Assigning to an already-occupied result index.'
          ) : invariant(!resultList.hasOwnProperty(resultIndex)));

          resultList[resultIndex] = renderNode;

          // This should match resultList.length and markupList.length when
          // we're done.
          resultListAssignmentCount += 1;

        } else if ("production" !== "development") {
          console.error(
            "Danger: Discarding unexpected node:",
            renderNode
          );
        }
      }
    }

    // Although resultList was populated out of order, it should now be a dense
    // array.
    ("production" !== "development" ? invariant(
      resultListAssignmentCount === resultList.length,
      'Danger: Did not assign to every index of resultList.'
    ) : invariant(resultListAssignmentCount === resultList.length));

    ("production" !== "development" ? invariant(
      resultList.length === markupList.length,
      'Danger: Expected markup to render %s nodes, but rendered %s.',
      markupList.length,
      resultList.length
    ) : invariant(resultList.length === markupList.length));

    return resultList;
  },

  /**
   * Replaces a node with a string of markup at its current position within its
   * parent. The markup must render into a single root node.
   *
   * @param {DOMElement} oldChild Child node to replace.
   * @param {string} markup Markup to render in place of the child node.
   * @internal
   */
  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a ' +
      'worker thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    ("production" !== "development" ? invariant(markup, 'dangerouslyReplaceNodeWithMarkup(...): Missing markup.') : invariant(markup));
    ("production" !== "development" ? invariant(
      oldChild.tagName.toLowerCase() !== 'html',
      'dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the ' +
      '<html> node. This is because browser quirks make this unreliable ' +
      'and/or slow. If you want to render to the root you must use ' +
      'server rendering. See renderComponentToString().'
    ) : invariant(oldChild.tagName.toLowerCase() !== 'html'));

    var newChild = createNodesFromMarkup(markup, emptyFunction)[0];
    oldChild.parentNode.replaceChild(newChild, oldChild);
  }

};

module.exports = Danger;

},{"./ExecutionEnvironment":20,"./createNodesFromMarkup":92,"./emptyFunction":95,"./getMarkupWrap":102,"./invariant":108}],11:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DefaultDOMPropertyConfig
 */

/*jslint bitwise: true*/

"use strict";

var DOMProperty = require("./DOMProperty");

var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;
var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
var HAS_SIDE_EFFECTS = DOMProperty.injection.HAS_SIDE_EFFECTS;
var HAS_POSITIVE_NUMERIC_VALUE =
  DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;

var DefaultDOMPropertyConfig = {
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  ),
  Properties: {
    /**
     * Standard Properties
     */
    accept: null,
    accessKey: null,
    action: null,
    allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    allowTransparency: MUST_USE_ATTRIBUTE,
    alt: null,
    async: HAS_BOOLEAN_VALUE,
    autoComplete: null,
    // autoFocus is polyfilled/normalized by AutoFocusMixin
    // autoFocus: HAS_BOOLEAN_VALUE,
    autoPlay: HAS_BOOLEAN_VALUE,
    cellPadding: null,
    cellSpacing: null,
    charSet: MUST_USE_ATTRIBUTE,
    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    className: MUST_USE_PROPERTY,
    cols: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    colSpan: null,
    content: null,
    contentEditable: null,
    contextMenu: MUST_USE_ATTRIBUTE,
    controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    crossOrigin: null,
    data: null, // For `<object />` acts as `src`.
    dateTime: MUST_USE_ATTRIBUTE,
    defer: HAS_BOOLEAN_VALUE,
    dir: null,
    disabled: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    download: null,
    draggable: null,
    encType: null,
    form: MUST_USE_ATTRIBUTE,
    formNoValidate: HAS_BOOLEAN_VALUE,
    frameBorder: MUST_USE_ATTRIBUTE,
    height: MUST_USE_ATTRIBUTE,
    hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    href: null,
    hrefLang: null,
    htmlFor: null,
    httpEquiv: null,
    icon: null,
    id: MUST_USE_PROPERTY,
    label: null,
    lang: null,
    list: null,
    loop: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    max: null,
    maxLength: MUST_USE_ATTRIBUTE,
    mediaGroup: null,
    method: null,
    min: null,
    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    name: null,
    noValidate: HAS_BOOLEAN_VALUE,
    pattern: null,
    placeholder: null,
    poster: null,
    preload: null,
    radioGroup: null,
    readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    rel: null,
    required: HAS_BOOLEAN_VALUE,
    role: MUST_USE_ATTRIBUTE,
    rows: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    rowSpan: null,
    sandbox: null,
    scope: null,
    scrollLeft: MUST_USE_PROPERTY,
    scrollTop: MUST_USE_PROPERTY,
    seamless: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    size: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
    span: HAS_POSITIVE_NUMERIC_VALUE,
    spellCheck: null,
    src: null,
    srcDoc: MUST_USE_PROPERTY,
    step: null,
    style: null,
    tabIndex: null,
    target: null,
    title: null,
    type: null,
    value: MUST_USE_PROPERTY | HAS_SIDE_EFFECTS,
    width: MUST_USE_ATTRIBUTE,
    wmode: MUST_USE_ATTRIBUTE,

    /**
     * Non-standard Properties
     */
    autoCapitalize: null, // Supported in Mobile Safari for keyboard hints
    autoCorrect: null, // Supported in Mobile Safari for keyboard hints
    property: null, // Supports OG in meta tags

    /**
     * SVG Properties
     */
    cx: MUST_USE_ATTRIBUTE,
    cy: MUST_USE_ATTRIBUTE,
    d: MUST_USE_ATTRIBUTE,
    fill: MUST_USE_ATTRIBUTE,
    fx: MUST_USE_ATTRIBUTE,
    fy: MUST_USE_ATTRIBUTE,
    gradientTransform: MUST_USE_ATTRIBUTE,
    gradientUnits: MUST_USE_ATTRIBUTE,
    offset: MUST_USE_ATTRIBUTE,
    points: MUST_USE_ATTRIBUTE,
    r: MUST_USE_ATTRIBUTE,
    rx: MUST_USE_ATTRIBUTE,
    ry: MUST_USE_ATTRIBUTE,
    spreadMethod: MUST_USE_ATTRIBUTE,
    stopColor: MUST_USE_ATTRIBUTE,
    stopOpacity: MUST_USE_ATTRIBUTE,
    stroke: MUST_USE_ATTRIBUTE,
    strokeLinecap: MUST_USE_ATTRIBUTE,
    strokeWidth: MUST_USE_ATTRIBUTE,
    transform: MUST_USE_ATTRIBUTE,
    version: MUST_USE_ATTRIBUTE,
    viewBox: MUST_USE_ATTRIBUTE,
    x1: MUST_USE_ATTRIBUTE,
    x2: MUST_USE_ATTRIBUTE,
    x: MUST_USE_ATTRIBUTE,
    y1: MUST_USE_ATTRIBUTE,
    y2: MUST_USE_ATTRIBUTE,
    y: MUST_USE_ATTRIBUTE
  },
  DOMAttributeNames: {
    className: 'class',
    gradientTransform: 'gradientTransform',
    gradientUnits: 'gradientUnits',
    htmlFor: 'for',
    spreadMethod: 'spreadMethod',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strokeLinecap: 'stroke-linecap',
    strokeWidth: 'stroke-width',
    viewBox: 'viewBox'
  },
  DOMPropertyNames: {
    autoCapitalize: 'autocapitalize',
    autoComplete: 'autocomplete',
    autoCorrect: 'autocorrect',
    autoFocus: 'autofocus',
    autoPlay: 'autoplay',
    encType: 'enctype',
    hrefLang: 'hreflang',
    radioGroup: 'radiogroup',
    spellCheck: 'spellcheck',
    srcDoc: 'srcdoc'
  },
  DOMMutationMethods: {
    /**
     * Setting `className` to null may cause it to be set to the string "null".
     *
     * @param {DOMElement} node
     * @param {*} value
     */
    className: function(node, value) {
      node.className = value || '';
    }
  }
};

module.exports = DefaultDOMPropertyConfig;

},{"./DOMProperty":8}],12:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DefaultEventPluginOrder
 */

"use strict";

 var keyOf = require("./keyOf");

/**
 * Module that is injectable into `EventPluginHub`, that specifies a
 * deterministic ordering of `EventPlugin`s. A convenient way to reason about
 * plugins, without having to package every one of them. This is better than
 * having plugins be ordered in the same order that they are injected because
 * that ordering would be influenced by the packaging order.
 * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
 * preventing default on events is convenient in `SimpleEventPlugin` handlers.
 */
var DefaultEventPluginOrder = [
  keyOf({ResponderEventPlugin: null}),
  keyOf({SimpleEventPlugin: null}),
  keyOf({TapEventPlugin: null}),
  keyOf({EnterLeaveEventPlugin: null}),
  keyOf({ChangeEventPlugin: null}),
  keyOf({SelectEventPlugin: null}),
  keyOf({CompositionEventPlugin: null}),
  keyOf({AnalyticsEventPlugin: null}),
  keyOf({MobileSafariClickEventPlugin: null})
];

module.exports = DefaultEventPluginOrder;

},{"./keyOf":115}],13:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EnterLeaveEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");

var ReactMount = require("./ReactMount");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactMount.getFirstReactDOM;

var eventTypes = {
  mouseEnter: {
    registrationName: keyOf({onMouseEnter: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  },
  mouseLeave: {
    registrationName: keyOf({onMouseLeave: null}),
    dependencies: [
      topLevelTypes.topMouseOut,
      topLevelTypes.topMouseOver
    ]
  }
};

var extractedEvents = [null, null];

var EnterLeaveEventPlugin = {

  eventTypes: eventTypes,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topMouseOver &&
        (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
      return null;
    }
    if (topLevelType !== topLevelTypes.topMouseOut &&
        topLevelType !== topLevelTypes.topMouseOver) {
      // Must not be a mouse in or mouse out - ignoring.
      return null;
    }

    var win;
    if (topLevelTarget.window === topLevelTarget) {
      // `topLevelTarget` is probably a window object.
      win = topLevelTarget;
    } else {
      // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
      var doc = topLevelTarget.ownerDocument;
      if (doc) {
        win = doc.defaultView || doc.parentWindow;
      } else {
        win = window;
      }
    }

    var from, to;
    if (topLevelType === topLevelTypes.topMouseOut) {
      from = topLevelTarget;
      to =
        getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
        win;
    } else {
      from = win;
      to = topLevelTarget;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    var fromID = from ? ReactMount.getID(from) : '';
    var toID = to ? ReactMount.getID(to) : '';

    var leave = SyntheticMouseEvent.getPooled(
      eventTypes.mouseLeave,
      fromID,
      nativeEvent
    );
    leave.type = 'mouseleave';
    leave.target = from;
    leave.relatedTarget = to;

    var enter = SyntheticMouseEvent.getPooled(
      eventTypes.mouseEnter,
      toID,
      nativeEvent
    );
    enter.type = 'mouseenter';
    enter.target = to;
    enter.relatedTarget = from;

    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);

    extractedEvents[0] = leave;
    extractedEvents[1] = enter;

    return extractedEvents;
  }

};

module.exports = EnterLeaveEventPlugin;

},{"./EventConstants":14,"./EventPropagators":19,"./ReactMount":55,"./SyntheticMouseEvent":80,"./keyOf":115}],14:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventConstants
 */

"use strict";

var keyMirror = require("./keyMirror");

var PropagationPhases = keyMirror({bubbled: null, captured: null});

/**
 * Types of raw signals from the browser caught at the top level.
 */
var topLevelTypes = keyMirror({
  topBlur: null,
  topChange: null,
  topClick: null,
  topCompositionEnd: null,
  topCompositionStart: null,
  topCompositionUpdate: null,
  topContextMenu: null,
  topCopy: null,
  topCut: null,
  topDoubleClick: null,
  topDrag: null,
  topDragEnd: null,
  topDragEnter: null,
  topDragExit: null,
  topDragLeave: null,
  topDragOver: null,
  topDragStart: null,
  topDrop: null,
  topError: null,
  topFocus: null,
  topInput: null,
  topKeyDown: null,
  topKeyPress: null,
  topKeyUp: null,
  topLoad: null,
  topMouseDown: null,
  topMouseMove: null,
  topMouseOut: null,
  topMouseOver: null,
  topMouseUp: null,
  topPaste: null,
  topReset: null,
  topScroll: null,
  topSelectionChange: null,
  topSubmit: null,
  topTouchCancel: null,
  topTouchEnd: null,
  topTouchMove: null,
  topTouchStart: null,
  topWheel: null
});

var EventConstants = {
  topLevelTypes: topLevelTypes,
  PropagationPhases: PropagationPhases
};

module.exports = EventConstants;

},{"./keyMirror":114}],15:[function(require,module,exports){
/**
 * @providesModule EventListener
 */

var emptyFunction = require("./emptyFunction");

/**
 * Upstream version of event listener. Does not take into account specific
 * nature of platform.
 */
var EventListener = {
  /**
   * Listen to DOM events during the bubble phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  listen: function(target, eventType, callback) {
    if (target.addEventListener) {
      target.addEventListener(eventType, callback, false);
      return {
        remove: function() {
          target.removeEventListener(eventType, callback, false);
        }
      };
    } else if (target.attachEvent) {
      target.attachEvent('on' + eventType, callback);
      return {
        remove: function() {
          target.detachEvent(eventType, callback);
        }
      };
    }
  },

  /**
   * Listen to DOM events during the capture phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  capture: function(target, eventType, callback) {
    if (!target.addEventListener) {
      if ("production" !== "development") {
        console.error(
          'Attempted to listen to events during the capture phase on a ' +
          'browser that does not support the capture phase. Your application ' +
          'will not receive some events.'
        );
      }
      return {
        remove: emptyFunction
      };
    } else {
      target.addEventListener(eventType, callback, true);
      return {
        remove: function() {
          target.removeEventListener(eventType, callback, true);
        }
      };
    }
  }
};

module.exports = EventListener;

},{"./emptyFunction":95}],16:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginHub
 */

"use strict";

var EventPluginRegistry = require("./EventPluginRegistry");
var EventPluginUtils = require("./EventPluginUtils");
var ExecutionEnvironment = require("./ExecutionEnvironment");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");
var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");

/**
 * Internal store for event listeners
 */
var listenerBank = {};

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
var eventQueue = null;

/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @private
 */
var executeDispatchesAndRelease = function(event) {
  if (event) {
    var executeDispatch = EventPluginUtils.executeDispatch;
    // Plugins can provide custom behavior when dispatching events.
    var PluginModule = EventPluginRegistry.getPluginModuleForEvent(event);
    if (PluginModule && PluginModule.executeDispatch) {
      executeDispatch = PluginModule.executeDispatch;
    }
    EventPluginUtils.executeDispatchesInOrder(event, executeDispatch);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};

/**
 * - `InstanceHandle`: [required] Module that performs logical traversals of DOM
 *   hierarchy given ids of the logical DOM elements involved.
 */
var InstanceHandle = null;

function validateInstanceHandle() {
  var invalid = !InstanceHandle||
    !InstanceHandle.traverseTwoPhase ||
    !InstanceHandle.traverseEnterLeave;
  if (invalid) {
    throw new Error('InstanceHandle not injected before use!');
  }
}

/**
 * This is a unified interface for event plugins to be installed and configured.
 *
 * Event plugins can implement the following properties:
 *
 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
 *     Required. When a top-level event is fired, this method is expected to
 *     extract synthetic events that will in turn be queued and dispatched.
 *
 *   `eventTypes` {object}
 *     Optional, plugins that fire events must publish a mapping of registration
 *     names that are used to register listeners. Values of this mapping must
 *     be objects that contain `registrationName` or `phasedRegistrationNames`.
 *
 *   `executeDispatch` {function(object, function, string)}
 *     Optional, allows plugins to override how an event gets dispatched. By
 *     default, the listener is simply invoked.
 *
 * Each plugin that is injected into `EventsPluginHub` is immediately operable.
 *
 * @public
 */
var EventPluginHub = {

  /**
   * Methods for injecting dependencies.
   */
  injection: {

    /**
     * @param {object} InjectedMount
     * @public
     */
    injectMount: EventPluginUtils.injection.injectMount,

    /**
     * @param {object} InjectedInstanceHandle
     * @public
     */
    injectInstanceHandle: function(InjectedInstanceHandle) {
      InstanceHandle = InjectedInstanceHandle;
      if ("production" !== "development") {
        validateInstanceHandle();
      }
    },

    getInstanceHandle: function() {
      if ("production" !== "development") {
        validateInstanceHandle();
      }
      return InstanceHandle;
    },

    /**
     * @param {array} InjectedEventPluginOrder
     * @public
     */
    injectEventPluginOrder: EventPluginRegistry.injectEventPluginOrder,

    /**
     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
     */
    injectEventPluginsByName: EventPluginRegistry.injectEventPluginsByName

  },

  eventNameDispatchConfigs: EventPluginRegistry.eventNameDispatchConfigs,

  registrationNameModules: EventPluginRegistry.registrationNameModules,

  /**
   * Stores `listener` at `listenerBank[registrationName][id]`. Is idempotent.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {?function} listener The callback to store.
   */
  putListener: function(id, registrationName, listener) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'Cannot call putListener() in a non-DOM environment.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    ("production" !== "development" ? invariant(
      !listener || typeof listener === 'function',
      'Expected %s listener to be a function, instead got type %s',
      registrationName, typeof listener
    ) : invariant(!listener || typeof listener === 'function'));

    if ("production" !== "development") {
      // IE8 has no API for event capturing and the `onScroll` event doesn't
      // bubble.
      if (registrationName === 'onScroll' &&
          !isEventSupported('scroll', true)) {
        console.warn('This browser doesn\'t support the `onScroll` event');
      }
    }
    var bankForRegistrationName =
      listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[id] = listener;
  },

  /**
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @return {?function} The stored callback.
   */
  getListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    return bankForRegistrationName && bankForRegistrationName[id];
  },

  /**
   * Deletes a listener from the registration bank.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   */
  deleteListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    if (bankForRegistrationName) {
      delete bankForRegistrationName[id];
    }
  },

  /**
   * Deletes all listeners for the DOM element with the supplied ID.
   *
   * @param {string} id ID of the DOM element.
   */
  deleteAllListeners: function(id) {
    for (var registrationName in listenerBank) {
      delete listenerBank[registrationName][id];
    }
  },

  /**
   * Allows registered plugins an opportunity to extract events from top-level
   * native browser events.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @internal
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events;
    var plugins = EventPluginRegistry.plugins;
    for (var i = 0, l = plugins.length; i < l; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i];
      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(
          topLevelType,
          topLevelTarget,
          topLevelTargetID,
          nativeEvent
        );
        if (extractedEvents) {
          events = accumulate(events, extractedEvents);
        }
      }
    }
    return events;
  },

  /**
   * Enqueues a synthetic event that should be dispatched when
   * `processEventQueue` is invoked.
   *
   * @param {*} events An accumulation of synthetic events.
   * @internal
   */
  enqueueEvents: function(events) {
    if (events) {
      eventQueue = accumulate(eventQueue, events);
    }
  },

  /**
   * Dispatches all synthetic events on the event queue.
   *
   * @internal
   */
  processEventQueue: function() {
    // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.
    var processingEventQueue = eventQueue;
    eventQueue = null;
    forEachAccumulated(processingEventQueue, executeDispatchesAndRelease);
    ("production" !== "development" ? invariant(
      !eventQueue,
      'processEventQueue(): Additional events were enqueued while processing ' +
      'an event queue. Support for this has not yet been implemented.'
    ) : invariant(!eventQueue));
  },

  /**
   * These are needed for tests only. Do not use!
   */
  __purge: function() {
    listenerBank = {};
  },

  __getListenerBank: function() {
    return listenerBank;
  }

};

module.exports = EventPluginHub;

},{"./EventPluginRegistry":17,"./EventPluginUtils":18,"./ExecutionEnvironment":20,"./accumulate":86,"./forEachAccumulated":98,"./invariant":108,"./isEventSupported":109}],17:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginRegistry
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Injectable ordering of event plugins.
 */
var EventPluginOrder = null;

/**
 * Injectable mapping from names to event plugin modules.
 */
var namesToPlugins = {};

/**
 * Recomputes the plugin list using the injected plugins and plugin ordering.
 *
 * @private
 */
function recomputePluginOrdering() {
  if (!EventPluginOrder) {
    // Wait until an `EventPluginOrder` is injected.
    return;
  }
  for (var pluginName in namesToPlugins) {
    var PluginModule = namesToPlugins[pluginName];
    var pluginIndex = EventPluginOrder.indexOf(pluginName);
    ("production" !== "development" ? invariant(
      pluginIndex > -1,
      'EventPluginRegistry: Cannot inject event plugins that do not exist in ' +
      'the plugin ordering, `%s`.',
      pluginName
    ) : invariant(pluginIndex > -1));
    if (EventPluginRegistry.plugins[pluginIndex]) {
      continue;
    }
    ("production" !== "development" ? invariant(
      PluginModule.extractEvents,
      'EventPluginRegistry: Event plugins must implement an `extractEvents` ' +
      'method, but `%s` does not.',
      pluginName
    ) : invariant(PluginModule.extractEvents));
    EventPluginRegistry.plugins[pluginIndex] = PluginModule;
    var publishedEvents = PluginModule.eventTypes;
    for (var eventName in publishedEvents) {
      ("production" !== "development" ? invariant(
        publishEventForPlugin(
          publishedEvents[eventName],
          PluginModule,
          eventName
        ),
        'EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.',
        eventName,
        pluginName
      ) : invariant(publishEventForPlugin(
        publishedEvents[eventName],
        PluginModule,
        eventName
      )));
    }
  }
}

/**
 * Publishes an event so that it can be dispatched by the supplied plugin.
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */
function publishEventForPlugin(dispatchConfig, PluginModule, eventName) {
  ("production" !== "development" ? invariant(
    !EventPluginRegistry.eventNameDispatchConfigs[eventName],
    'EventPluginHub: More than one plugin attempted to publish the same ' +
    'event name, `%s`.',
    eventName
  ) : invariant(!EventPluginRegistry.eventNameDispatchConfigs[eventName]));
  EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;

  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (var phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        var phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(
          phasedRegistrationName,
          PluginModule,
          eventName
        );
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      PluginModule,
      eventName
    );
    return true;
  }
  return false;
}

/**
 * Publishes a registration name that is used to identify dispatched events and
 * can be used with `EventPluginHub.putListener` to register listeners.
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */
function publishRegistrationName(registrationName, PluginModule, eventName) {
  ("production" !== "development" ? invariant(
    !EventPluginRegistry.registrationNameModules[registrationName],
    'EventPluginHub: More than one plugin attempted to publish the same ' +
    'registration name, `%s`.',
    registrationName
  ) : invariant(!EventPluginRegistry.registrationNameModules[registrationName]));
  EventPluginRegistry.registrationNameModules[registrationName] = PluginModule;
  EventPluginRegistry.registrationNameDependencies[registrationName] =
    PluginModule.eventTypes[eventName].dependencies;
}

/**
 * Registers plugins so that they can extract and dispatch events.
 *
 * @see {EventPluginHub}
 */
var EventPluginRegistry = {

  /**
   * Ordered list of injected plugins.
   */
  plugins: [],

  /**
   * Mapping from event name to dispatch config
   */
  eventNameDispatchConfigs: {},

  /**
   * Mapping from registration name to plugin module
   */
  registrationNameModules: {},

  /**
   * Mapping from registration name to event name
   */
  registrationNameDependencies: {},

  /**
   * Injects an ordering of plugins (by plugin name). This allows the ordering
   * to be decoupled from injection of the actual plugins so that ordering is
   * always deterministic regardless of packaging, on-the-fly injection, etc.
   *
   * @param {array} InjectedEventPluginOrder
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginOrder}
   */
  injectEventPluginOrder: function(InjectedEventPluginOrder) {
    ("production" !== "development" ? invariant(
      !EventPluginOrder,
      'EventPluginRegistry: Cannot inject event plugin ordering more than once.'
    ) : invariant(!EventPluginOrder));
    // Clone the ordering so it cannot be dynamically mutated.
    EventPluginOrder = Array.prototype.slice.call(InjectedEventPluginOrder);
    recomputePluginOrdering();
  },

  /**
   * Injects plugins to be used by `EventPluginHub`. The plugin names must be
   * in the ordering injected by `injectEventPluginOrder`.
   *
   * Plugins can be injected as part of page initialization or on-the-fly.
   *
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginsByName}
   */
  injectEventPluginsByName: function(injectedNamesToPlugins) {
    var isOrderingDirty = false;
    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }
      var PluginModule = injectedNamesToPlugins[pluginName];
      if (namesToPlugins[pluginName] !== PluginModule) {
        ("production" !== "development" ? invariant(
          !namesToPlugins[pluginName],
          'EventPluginRegistry: Cannot inject two different event plugins ' +
          'using the same name, `%s`.',
          pluginName
        ) : invariant(!namesToPlugins[pluginName]));
        namesToPlugins[pluginName] = PluginModule;
        isOrderingDirty = true;
      }
    }
    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  },

  /**
   * Looks up the plugin for the supplied event.
   *
   * @param {object} event A synthetic event.
   * @return {?object} The plugin that created the supplied event.
   * @internal
   */
  getPluginModuleForEvent: function(event) {
    var dispatchConfig = event.dispatchConfig;
    if (dispatchConfig.registrationName) {
      return EventPluginRegistry.registrationNameModules[
        dispatchConfig.registrationName
      ] || null;
    }
    for (var phase in dispatchConfig.phasedRegistrationNames) {
      if (!dispatchConfig.phasedRegistrationNames.hasOwnProperty(phase)) {
        continue;
      }
      var PluginModule = EventPluginRegistry.registrationNameModules[
        dispatchConfig.phasedRegistrationNames[phase]
      ];
      if (PluginModule) {
        return PluginModule;
      }
    }
    return null;
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _resetEventPlugins: function() {
    EventPluginOrder = null;
    for (var pluginName in namesToPlugins) {
      if (namesToPlugins.hasOwnProperty(pluginName)) {
        delete namesToPlugins[pluginName];
      }
    }
    EventPluginRegistry.plugins.length = 0;

    var eventNameDispatchConfigs = EventPluginRegistry.eventNameDispatchConfigs;
    for (var eventName in eventNameDispatchConfigs) {
      if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
        delete eventNameDispatchConfigs[eventName];
      }
    }

    var registrationNameModules = EventPluginRegistry.registrationNameModules;
    for (var registrationName in registrationNameModules) {
      if (registrationNameModules.hasOwnProperty(registrationName)) {
        delete registrationNameModules[registrationName];
      }
    }
  }

};

module.exports = EventPluginRegistry;

},{"./invariant":108}],18:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginUtils
 */

"use strict";

var EventConstants = require("./EventConstants");

var invariant = require("./invariant");

/**
 * Injected dependencies:
 */

/**
 * - `Mount`: [required] Module that can convert between React dom IDs and
 *   actual node references.
 */
var injection = {
  Mount: null,
  injectMount: function(InjectedMount) {
    injection.Mount = InjectedMount;
    if ("production" !== "development") {
      ("production" !== "development" ? invariant(
        InjectedMount && InjectedMount.getNode,
        'EventPluginUtils.injection.injectMount(...): Injected Mount module ' +
        'is missing getNode.'
      ) : invariant(InjectedMount && InjectedMount.getNode));
    }
  }
};

var topLevelTypes = EventConstants.topLevelTypes;

function isEndish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseUp ||
         topLevelType === topLevelTypes.topTouchEnd ||
         topLevelType === topLevelTypes.topTouchCancel;
}

function isMoveish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseMove ||
         topLevelType === topLevelTypes.topTouchMove;
}
function isStartish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseDown ||
         topLevelType === topLevelTypes.topTouchStart;
}


var validateEventDispatches;
if ("production" !== "development") {
  validateEventDispatches = function(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchIDs = event._dispatchIDs;

    var listenersIsArr = Array.isArray(dispatchListeners);
    var idsIsArr = Array.isArray(dispatchIDs);
    var IDsLen = idsIsArr ? dispatchIDs.length : dispatchIDs ? 1 : 0;
    var listenersLen = listenersIsArr ?
      dispatchListeners.length :
      dispatchListeners ? 1 : 0;

    ("production" !== "development" ? invariant(
      idsIsArr === listenersIsArr && IDsLen === listenersLen,
      'EventPluginUtils: Invalid `event`.'
    ) : invariant(idsIsArr === listenersIsArr && IDsLen === listenersLen));
  };
}

/**
 * Invokes `cb(event, listener, id)`. Avoids using call if no scope is
 * provided. The `(listener,id)` pair effectively forms the "dispatch" but are
 * kept separate to conserve memory.
 */
function forEachEventDispatch(event, cb) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  if ("production" !== "development") {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and IDs are two parallel arrays that are always in sync.
      cb(event, dispatchListeners[i], dispatchIDs[i]);
    }
  } else if (dispatchListeners) {
    cb(event, dispatchListeners, dispatchIDs);
  }
}

/**
 * Default implementation of PluginModule.executeDispatch().
 * @param {SyntheticEvent} SyntheticEvent to handle
 * @param {function} Application-level callback
 * @param {string} domID DOM id to pass to the callback.
 */
function executeDispatch(event, listener, domID) {
  event.currentTarget = injection.Mount.getNode(domID);
  var returnValue = listener(event, domID);
  event.currentTarget = null;
  return returnValue;
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(event, executeDispatch) {
  forEachEventDispatch(event, executeDispatch);
  event._dispatchListeners = null;
  event._dispatchIDs = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return id of the first dispatch execution who's listener returns true, or
 * null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrue(event) {
  var dispatchListeners = event._dispatchListeners;
  var dispatchIDs = event._dispatchIDs;
  if ("production" !== "development") {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and IDs are two parallel arrays that are always in sync.
      if (dispatchListeners[i](event, dispatchIDs[i])) {
        return dispatchIDs[i];
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(event, dispatchIDs)) {
      return dispatchIDs;
    }
  }
  return null;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @return The return value of executing the single dispatch.
 */
function executeDirectDispatch(event) {
  if ("production" !== "development") {
    validateEventDispatches(event);
  }
  var dispatchListener = event._dispatchListeners;
  var dispatchID = event._dispatchIDs;
  ("production" !== "development" ? invariant(
    !Array.isArray(dispatchListener),
    'executeDirectDispatch(...): Invalid `event`.'
  ) : invariant(!Array.isArray(dispatchListener)));
  var res = dispatchListener ?
    dispatchListener(event, dispatchID) :
    null;
  event._dispatchListeners = null;
  event._dispatchIDs = null;
  return res;
}

/**
 * @param {SyntheticEvent} event
 * @return {bool} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(event) {
  return !!event._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,

  executeDirectDispatch: executeDirectDispatch,
  executeDispatch: executeDispatch,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  hasDispatches: hasDispatches,
  injection: injection,
  useTouchEvents: false
};

module.exports = EventPluginUtils;

},{"./EventConstants":14,"./invariant":108}],19:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPropagators
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");

var PropagationPhases = EventConstants.PropagationPhases;
var getListener = EventPluginHub.getListener;

/**
 * Some event types have a notion of different registration names for different
 * "phases" of propagation. This finds listeners by a given phase.
 */
function listenerAtPhase(id, event, propagationPhase) {
  var registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(id, registrationName);
}

/**
 * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
 * here, allows us to not have to bind or create functions for each event.
 * Mutating the event's members allows us to not have to create a wrapping
 * "dispatch" object that pairs the event with the listener.
 */
function accumulateDirectionalDispatches(domID, upwards, event) {
  if ("production" !== "development") {
    if (!domID) {
      throw new Error('Dispatching id must not be null');
    }
  }
  var phase = upwards ? PropagationPhases.bubbled : PropagationPhases.captured;
  var listener = listenerAtPhase(domID, event, phase);
  if (listener) {
    event._dispatchListeners = accumulate(event._dispatchListeners, listener);
    event._dispatchIDs = accumulate(event._dispatchIDs, domID);
  }
}

/**
 * Collect dispatches (must be entirely collected before dispatching - see unit
 * tests). Lazily allocate the array to conserve memory.  We must loop through
 * each event and perform the traversal for each one. We can not perform a
 * single traversal for the entire collection of events because each event may
 * have a different target.
 */
function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    EventPluginHub.injection.getInstanceHandle().traverseTwoPhase(
      event.dispatchMarker,
      accumulateDirectionalDispatches,
      event
    );
  }
}


/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(id, ignoredDirection, event) {
  if (event && event.dispatchConfig.registrationName) {
    var registrationName = event.dispatchConfig.registrationName;
    var listener = getListener(id, registrationName);
    if (listener) {
      event._dispatchListeners = accumulate(event._dispatchListeners, listener);
      event._dispatchIDs = accumulate(event._dispatchIDs, id);
    }
  }
}

/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event.dispatchMarker, null, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateEnterLeaveDispatches(leave, enter, fromID, toID) {
  EventPluginHub.injection.getInstanceHandle().traverseEnterLeave(
    fromID,
    toID,
    accumulateDispatches,
    leave,
    enter
  );
}


function accumulateDirectDispatches(events) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle);
}



/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing event a
 * single one.
 *
 * @constructor EventPropagators
 */
var EventPropagators = {
  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
  accumulateDirectDispatches: accumulateDirectDispatches,
  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
};

module.exports = EventPropagators;

},{"./EventConstants":14,"./EventPluginHub":16,"./accumulate":86,"./forEachAccumulated":98}],20:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ExecutionEnvironment
 */

/*jslint evil: true */

"use strict";

var canUseDOM = typeof window !== 'undefined';

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  canUseEventListeners:
    canUseDOM && (window.addEventListener || window.attachEvent),

  isInWorker: !canUseDOM // For now, this is true - might change in the future.

};

module.exports = ExecutionEnvironment;

},{}],21:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule LinkedValueUtils
 * @typechecks static-only
 */

"use strict";

var ReactPropTypes = require("./ReactPropTypes");

var invariant = require("./invariant");

var hasReadOnlyValue = {
  'button': true,
  'checkbox': true,
  'image': true,
  'hidden': true,
  'radio': true,
  'reset': true,
  'submit': true
};

function _assertSingleLink(input) {
  ("production" !== "development" ? invariant(
      input.props.checkedLink == null || input.props.valueLink == null,
      'Cannot provide a checkedLink and a valueLink. If you want to use ' +
      'checkedLink, you probably don\'t want to use valueLink and vice versa.'
  ) : invariant(input.props.checkedLink == null || input.props.valueLink == null));
}
function _assertValueLink(input) {
  _assertSingleLink(input);
  ("production" !== "development" ? invariant(
    input.props.value == null && input.props.onChange == null,
    'Cannot provide a valueLink and a value or onChange event. If you want ' +
    'to use value or onChange, you probably don\'t want to use valueLink.'
  ) : invariant(input.props.value == null && input.props.onChange == null));
}

function _assertCheckedLink(input) {
  _assertSingleLink(input);
  ("production" !== "development" ? invariant(
    input.props.checked == null && input.props.onChange == null,
    'Cannot provide a checkedLink and a checked property or onChange event. ' +
    'If you want to use checked or onChange, you probably don\'t want to ' +
    'use checkedLink'
  ) : invariant(input.props.checked == null && input.props.onChange == null));
}

/**
 * @param {SyntheticEvent} e change event to handle
 */
function _handleLinkedValueChange(e) {
  /*jshint validthis:true */
  this.props.valueLink.requestChange(e.target.value);
}

/**
  * @param {SyntheticEvent} e change event to handle
  */
function _handleLinkedCheckChange(e) {
  /*jshint validthis:true */
  this.props.checkedLink.requestChange(e.target.checked);
}

/**
 * Provide a linked `value` attribute for controlled forms. You should not use
 * this outside of the ReactDOM controlled form components.
 */
var LinkedValueUtils = {
  Mixin: {
    propTypes: {
      value: function(props, propName, componentName) {
        if ("production" !== "development") {
          if (props[propName] &&
              !hasReadOnlyValue[props.type] &&
              !props.onChange &&
              !props.readOnly &&
              !props.disabled) {
            console.warn(
              'You provided a `value` prop to a form field without an ' +
              '`onChange` handler. This will render a read-only field. If ' +
              'the field should be mutable use `defaultValue`. Otherwise, ' +
              'set either `onChange` or `readOnly`.'
            );
          }
        }
      },
      checked: function(props, propName, componentName) {
        if ("production" !== "development") {
          if (props[propName] &&
              !props.onChange &&
              !props.readOnly &&
              !props.disabled) {
            console.warn(
              'You provided a `checked` prop to a form field without an ' +
              '`onChange` handler. This will render a read-only field. If ' +
              'the field should be mutable use `defaultChecked`. Otherwise, ' +
              'set either `onChange` or `readOnly`.'
            );
          }
        }
      },
      onChange: ReactPropTypes.func
    }
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {*} current value of the input either from value prop or link.
   */
  getValue: function(input) {
    if (input.props.valueLink) {
      _assertValueLink(input);
      return input.props.valueLink.value;
    }
    return input.props.value;
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {*} current checked status of the input either from checked prop
   *             or link.
   */
  getChecked: function(input) {
    if (input.props.checkedLink) {
      _assertCheckedLink(input);
      return input.props.checkedLink.value;
    }
    return input.props.checked;
  },

  /**
   * @param {ReactComponent} input Form component
   * @return {function} change callback either from onChange prop or link.
   */
  getOnChange: function(input) {
    if (input.props.valueLink) {
      _assertValueLink(input);
      return _handleLinkedValueChange;
    } else if (input.props.checkedLink) {
      _assertCheckedLink(input);
      return _handleLinkedCheckChange;
    }
    return input.props.onChange;
  }
};

module.exports = LinkedValueUtils;

},{"./ReactPropTypes":64,"./invariant":108}],22:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule MobileSafariClickEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");

var emptyFunction = require("./emptyFunction");

var topLevelTypes = EventConstants.topLevelTypes;

/**
 * Mobile Safari does not fire properly bubble click events on non-interactive
 * elements, which means delegated click listeners do not fire. The workaround
 * for this bug involves attaching an empty click listener on the target node.
 *
 * This particular plugin works around the bug by attaching an empty click
 * listener on `touchstart` (which does fire on every element).
 */
var MobileSafariClickEventPlugin = {

  eventTypes: null,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topTouchStart) {
      var target = nativeEvent.target;
      if (target && !target.onclick) {
        target.onclick = emptyFunction;
      }
    }
  }

};

module.exports = MobileSafariClickEventPlugin;

},{"./EventConstants":14,"./emptyFunction":95}],23:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule PooledClass
 */

"use strict";

var invariant = require("./invariant");

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function(a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function(a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fiveArgumentPooler = function(a1, a2, a3, a4, a5) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4, a5);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4, a5);
  }
};

var standardReleaser = function(instance) {
  var Klass = this;
  ("production" !== "development" ? invariant(
    instance instanceof Klass,
    'Trying to release an instance into a pool of a different type.'
  ) : invariant(instance instanceof Klass));
  if (instance.destructor) {
    instance.destructor();
  }
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances (optional).
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function(CopyConstructor, pooler) {
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fiveArgumentPooler: fiveArgumentPooler
};

module.exports = PooledClass;

},{"./invariant":108}],24:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule React
 */

"use strict";

var DOMPropertyOperations = require("./DOMPropertyOperations");
var EventPluginUtils = require("./EventPluginUtils");
var ReactChildren = require("./ReactChildren");
var ReactComponent = require("./ReactComponent");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactDOM = require("./ReactDOM");
var ReactDOMComponent = require("./ReactDOMComponent");
var ReactDefaultInjection = require("./ReactDefaultInjection");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");
var ReactMultiChild = require("./ReactMultiChild");
var ReactPerf = require("./ReactPerf");
var ReactPropTypes = require("./ReactPropTypes");
var ReactServerRendering = require("./ReactServerRendering");
var ReactTextComponent = require("./ReactTextComponent");

var onlyChild = require("./onlyChild");

ReactDefaultInjection.inject();

var React = {
  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    only: onlyChild
  },
  DOM: ReactDOM,
  PropTypes: ReactPropTypes,
  initializeTouchEvents: function(shouldUseTouch) {
    EventPluginUtils.useTouchEvents = shouldUseTouch;
  },
  createClass: ReactCompositeComponent.createClass,
  constructAndRenderComponent: ReactMount.constructAndRenderComponent,
  constructAndRenderComponentByID: ReactMount.constructAndRenderComponentByID,
  renderComponent: ReactPerf.measure(
    'React',
    'renderComponent',
    ReactMount.renderComponent
  ),
  renderComponentToString: ReactServerRendering.renderComponentToString,
  unmountComponentAtNode: ReactMount.unmountComponentAtNode,
  isValidClass: ReactCompositeComponent.isValidClass,
  isValidComponent: ReactComponent.isValidComponent,
  withContext: ReactContext.withContext,
  __internals: {
    Component: ReactComponent,
    CurrentOwner: ReactCurrentOwner,
    DOMComponent: ReactDOMComponent,
    DOMPropertyOperations: DOMPropertyOperations,
    InstanceHandles: ReactInstanceHandles,
    Mount: ReactMount,
    MultiChild: ReactMultiChild,
    TextComponent: ReactTextComponent
  }
};

if ("production" !== "development") {
  var ExecutionEnvironment = require("./ExecutionEnvironment");
  if (ExecutionEnvironment.canUseDOM &&
      window.top === window.self &&
      navigator.userAgent.indexOf('Chrome') > -1) {
    console.debug(
      'Download the React DevTools for a better development experience: ' +
      'http://fb.me/react-devtools'
    );
  }
}

// Version exists only in the open-source version of React, not in Facebook's
// internal version.
React.version = '0.9.0';

module.exports = React;

},{"./DOMPropertyOperations":9,"./EventPluginUtils":18,"./ExecutionEnvironment":20,"./ReactChildren":25,"./ReactComponent":26,"./ReactCompositeComponent":29,"./ReactContext":30,"./ReactCurrentOwner":31,"./ReactDOM":32,"./ReactDOMComponent":34,"./ReactDefaultInjection":44,"./ReactInstanceHandles":53,"./ReactMount":55,"./ReactMultiChild":57,"./ReactPerf":60,"./ReactPropTypes":64,"./ReactServerRendering":68,"./ReactTextComponent":69,"./onlyChild":123}],25:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactChildren
 */

"use strict";

var PooledClass = require("./PooledClass");

var invariant = require("./invariant");
var traverseAllChildren = require("./traverseAllChildren");

var twoArgumentPooler = PooledClass.twoArgumentPooler;
var threeArgumentPooler = PooledClass.threeArgumentPooler;

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * traversal. Allows avoiding binding callbacks.
 *
 * @constructor ForEachBookKeeping
 * @param {!function} forEachFunction Function to perform traversal with.
 * @param {?*} forEachContext Context to perform context with.
 */
function ForEachBookKeeping(forEachFunction, forEachContext) {
  this.forEachFunction = forEachFunction;
  this.forEachContext = forEachContext;
}
PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

function forEachSingleChild(traverseContext, child, name, i) {
  var forEachBookKeeping = traverseContext;
  forEachBookKeeping.forEachFunction.call(
    forEachBookKeeping.forEachContext, child, i);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc.
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }

  var traverseContext =
    ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  ForEachBookKeeping.release(traverseContext);
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, mapFunction, mapContext) {
  this.mapResult = mapResult;
  this.mapFunction = mapFunction;
  this.mapContext = mapContext;
}
PooledClass.addPoolingTo(MapBookKeeping, threeArgumentPooler);

function mapSingleChildIntoContext(traverseContext, child, name, i) {
  var mapBookKeeping = traverseContext;
  var mapResult = mapBookKeeping.mapResult;
  var mappedChild =
    mapBookKeeping.mapFunction.call(mapBookKeeping.mapContext, child, i);
  // We found a component instance
  ("production" !== "development" ? invariant(
    !mapResult.hasOwnProperty(name),
    'ReactChildren.map(...): Encountered two children with the same key, ' +
    '`%s`. Children keys must be unique.',
    name
  ) : invariant(!mapResult.hasOwnProperty(name)));
  mapResult[name] = mappedChild;
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * TODO: This may likely break any calls to `ReactChildren.map` that were
 * previously relying on the fact that we guarded against null children.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} mapFunction.
 * @param {*} mapContext Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }

  var mapResult = {};
  var traverseContext = MapBookKeeping.getPooled(mapResult, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
  return mapResult;
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren
};

module.exports = ReactChildren;

},{"./PooledClass":23,"./invariant":108,"./traverseAllChildren":128}],26:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponent
 */

"use strict";

var ReactComponentEnvironment = require("./ReactComponentEnvironment");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactOwner = require("./ReactOwner");
var ReactUpdates = require("./ReactUpdates");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");

/**
 * Every React component is in one of these life cycles.
 */
var ComponentLifeCycle = keyMirror({
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  MOUNTED: null,
  /**
   * Unmounted components are inactive and cannot receive new props.
   */
  UNMOUNTED: null
});

/**
 * Warn if there's no key explicitly set on dynamic arrays of children or
 * object keys are not valid. This allows us to keep track of children between
 * updates.
 */

var ownerHasExplicitKeyWarning = {};
var ownerHasPropertyWarning = {};

var NUMERIC_PROPERTY_REGEX = /^\d+$/;

/**
 * Warn if the component doesn't have an explicit key assigned to it.
 * This component is in an array. The array could grow and shrink or be
 * reordered. All children that haven't already been validated are required to
 * have a "key" property assigned to it.
 *
 * @internal
 * @param {ReactComponent} component Component that requires a key.
 */
function validateExplicitKey(component) {
  if (component.__keyValidated__ || component.props.key != null) {
    return;
  }
  component.__keyValidated__ = true;

  // We can't provide friendly warnings for top level components.
  if (!ReactCurrentOwner.current) {
    return;
  }

  // Name of the component whose render method tried to pass children.
  var currentName = ReactCurrentOwner.current.constructor.displayName;
  if (ownerHasExplicitKeyWarning.hasOwnProperty(currentName)) {
    return;
  }
  ownerHasExplicitKeyWarning[currentName] = true;

  var message = 'Each child in an array should have a unique "key" prop. ' +
                'Check the render method of ' + currentName + '.';
  if (!component.isOwnedBy(ReactCurrentOwner.current)) {
    // Name of the component that originally created this child.
    var childOwnerName =
      component._owner &&
      component._owner.constructor.displayName;

    // Usually the current owner is the offender, but if it accepts
    // children as a property, it may be the creator of the child that's
    // responsible for assigning it a key.
    message += ' It was passed a child from ' + childOwnerName + '.';
  }

  message += ' See http://fb.me/react-warning-keys for more information.';
  console.warn(message);
}

/**
 * Warn if the key is being defined as an object property but has an incorrect
 * value.
 *
 * @internal
 * @param {string} name Property name of the key.
 * @param {ReactComponent} component Component that requires a key.
 */
function validatePropertyKey(name) {
  if (NUMERIC_PROPERTY_REGEX.test(name)) {
    // Name of the component whose render method tried to pass children.
    var currentName = ReactCurrentOwner.current.constructor.displayName;
    if (ownerHasPropertyWarning.hasOwnProperty(currentName)) {
      return;
    }
    ownerHasPropertyWarning[currentName] = true;

    console.warn(
      'Child objects should have non-numeric keys so ordering is preserved. ' +
      'Check the render method of ' + currentName + '. ' +
      'See http://fb.me/react-warning-keys for more information.'
    );
  }
}

/**
 * Ensure that every component either is passed in a static location, in an
 * array with an explicit keys property defined, or in an object literal
 * with valid key property.
 *
 * @internal
 * @param {*} component Statically passed child of any type.
 * @return {boolean}
 */
function validateChildKeys(component) {
  if (Array.isArray(component)) {
    for (var i = 0; i < component.length; i++) {
      var child = component[i];
      if (ReactComponent.isValidComponent(child)) {
        validateExplicitKey(child);
      }
    }
  } else if (ReactComponent.isValidComponent(component)) {
    // This component was passed in a valid location.
    component.__keyValidated__ = true;
  } else if (component && typeof component === 'object') {
    for (var name in component) {
      validatePropertyKey(name, component);
    }
  }
}

/**
 * Components are the basic units of composition in React.
 *
 * Every component accepts a set of keyed input parameters known as "props" that
 * are initialized by the constructor. Once a component is mounted, the props
 * can be mutated using `setProps` or `replaceProps`.
 *
 * Every component is capable of the following operations:
 *
 *   `mountComponent`
 *     Initializes the component, renders markup, and registers event listeners.
 *
 *   `receiveComponent`
 *     Updates the rendered DOM nodes to match the given component.
 *
 *   `unmountComponent`
 *     Releases any resources allocated by this component.
 *
 * Components can also be "owned" by other components. Being owned by another
 * component means being constructed by that component. This is different from
 * being the child of a component, which means having a DOM representation that
 * is a child of the DOM representation of that component.
 *
 * @class ReactComponent
 */
var ReactComponent = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid component.
   * @final
   */
  isValidComponent: function(object) {
    if (!object || !object.type || !object.type.prototype) {
      return false;
    }
    // This is the safer way of duck checking the type of instance this is.
    // The object can be a generic descriptor but the type property refers to
    // the constructor and it's prototype can be used to inspect the type that
    // will actually get mounted.
    var prototype = object.type.prototype;
    return (
      typeof prototype.mountComponentIntoNode === 'function' &&
      typeof prototype.receiveComponent === 'function'
    );
  },

  /**
   * @internal
   */
  LifeCycle: ComponentLifeCycle,

  /**
   * Injected module that provides ability to mutate individual properties.
   * Injected into the base class because many different subclasses need access
   * to this.
   *
   * @internal
   */
  BackendIDOperations: ReactComponentEnvironment.BackendIDOperations,

  /**
   * Optionally injectable environment dependent cleanup hook. (server vs.
   * browser etc). Example: A browser system caches DOM nodes based on component
   * ID and must remove that cache entry when this instance is unmounted.
   *
   * @private
   */
  unmountIDFromEnvironment: ReactComponentEnvironment.unmountIDFromEnvironment,

  /**
   * The "image" of a component tree, is the platform specific (typically
   * serialized) data that represents a tree of lower level UI building blocks.
   * On the web, this "image" is HTML markup which describes a construction of
   * low level `div` and `span` nodes. Other platforms may have different
   * encoding of this "image". This must be injected.
   *
   * @private
   */
  mountImageIntoNode: ReactComponentEnvironment.mountImageIntoNode,

  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction:
    ReactComponentEnvironment.ReactReconcileTransaction,

  /**
   * Base functionality for every ReactComponent constructor. Mixed into the
   * `ReactComponent` prototype, but exposed statically for easy access.
   *
   * @lends {ReactComponent.prototype}
   */
  Mixin: merge(ReactComponentEnvironment.Mixin, {

    /**
     * Checks whether or not this component is mounted.
     *
     * @return {boolean} True if mounted, false otherwise.
     * @final
     * @protected
     */
    isMounted: function() {
      return this._lifeCycleState === ComponentLifeCycle.MOUNTED;
    },

    /**
     * Sets a subset of the props.
     *
     * @param {object} partialProps Subset of the next props.
     * @param {?function} callback Called after props are updated.
     * @final
     * @public
     */
    setProps: function(partialProps, callback) {
      // Merge with `_pendingProps` if it exists, otherwise with existing props.
      this.replaceProps(
        merge(this._pendingProps || this.props, partialProps),
        callback
      );
    },

    /**
     * Replaces all of the props.
     *
     * @param {object} props New props.
     * @param {?function} callback Called after props are updated.
     * @final
     * @public
     */
    replaceProps: function(props, callback) {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'replaceProps(...): Can only update a mounted component.'
      ) : invariant(this.isMounted()));
      ("production" !== "development" ? invariant(
        this._mountDepth === 0,
        'replaceProps(...): You called `setProps` or `replaceProps` on a ' +
        'component with a parent. This is an anti-pattern since props will ' +
        'get reactively updated when rendered. Instead, change the owner\'s ' +
        '`render` method to pass the correct value as props to the component ' +
        'where it is created.'
      ) : invariant(this._mountDepth === 0));
      this._pendingProps = props;
      ReactUpdates.enqueueUpdate(this, callback);
    },

    /**
     * Base constructor for all React components.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.construct.call(this, ...)`.
     *
     * @param {?object} initialProps
     * @param {*} children
     * @internal
     */
    construct: function(initialProps, children) {
      this.props = initialProps || {};
      // Record the component responsible for creating this component.
      this._owner = ReactCurrentOwner.current;
      // All components start unmounted.
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;

      this._pendingProps = null;
      this._pendingCallbacks = null;

      // Unlike _pendingProps and _pendingCallbacks, we won't use null to
      // indicate that nothing is pending because it's possible for a component
      // to have a null owner. Instead, an owner change is pending when
      // this._owner !== this._pendingOwner.
      this._pendingOwner = this._owner;

      // Children can be more than one argument
      var childrenLength = arguments.length - 1;
      if (childrenLength === 1) {
        if ("production" !== "development") {
          validateChildKeys(children);
        }
        this.props.children = children;
      } else if (childrenLength > 1) {
        var childArray = Array(childrenLength);
        for (var i = 0; i < childrenLength; i++) {
          if ("production" !== "development") {
            validateChildKeys(arguments[i + 1]);
          }
          childArray[i] = arguments[i + 1];
        }
        this.props.children = childArray;
      }
    },

    /**
     * Initializes the component, renders markup, and registers event listeners.
     *
     * NOTE: This does not insert any nodes into the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.mountComponent.call(this, ...)`.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {ReactReconcileTransaction} transaction
     * @param {number} mountDepth number of components in the owner hierarchy.
     * @return {?string} Rendered markup to be inserted into the DOM.
     * @internal
     */
    mountComponent: function(rootID, transaction, mountDepth) {
      ("production" !== "development" ? invariant(
        !this.isMounted(),
        'mountComponent(%s, ...): Can only mount an unmounted component. ' +
        'Make sure to avoid storing components between renders or reusing a ' +
        'single component instance in multiple places.',
        rootID
      ) : invariant(!this.isMounted()));
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.addComponentAsRefTo(this, props.ref, this._owner);
      }
      this._rootNodeID = rootID;
      this._lifeCycleState = ComponentLifeCycle.MOUNTED;
      this._mountDepth = mountDepth;
      // Effectively: return '';
    },

    /**
     * Releases any resources allocated by `mountComponent`.
     *
     * NOTE: This does not remove any nodes from the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.unmountComponent.call(this)`.
     *
     * @internal
     */
    unmountComponent: function() {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'unmountComponent(): Can only unmount a mounted component.'
      ) : invariant(this.isMounted()));
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.removeComponentAsRefFrom(this, props.ref, this._owner);
      }
      ReactComponent.unmountIDFromEnvironment(this._rootNodeID);
      this._rootNodeID = null;
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
    },

    /**
     * Given a new instance of this component, updates the rendered DOM nodes
     * as if that instance was rendered instead.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.receiveComponent.call(this, ...)`.
     *
     * @param {object} nextComponent Next set of properties.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    receiveComponent: function(nextComponent, transaction) {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'receiveComponent(...): Can only update a mounted component.'
      ) : invariant(this.isMounted()));
      this._pendingOwner = nextComponent._owner;
      this._pendingProps = nextComponent.props;
      this._performUpdateIfNecessary(transaction);
    },

    /**
     * Call `_performUpdateIfNecessary` within a new transaction.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    performUpdateIfNecessary: function() {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(this._performUpdateIfNecessary, this, transaction);
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * If `_pendingProps` is set, update the component.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    _performUpdateIfNecessary: function(transaction) {
      if (this._pendingProps == null) {
        return;
      }
      var prevProps = this.props;
      var prevOwner = this._owner;
      this.props = this._pendingProps;
      this._owner = this._pendingOwner;
      this._pendingProps = null;
      this.updateComponent(transaction, prevProps, prevOwner);
    },

    /**
     * Updates the component's currently mounted representation.
     *
     * @param {ReactReconcileTransaction} transaction
     * @param {object} prevProps
     * @internal
     */
    updateComponent: function(transaction, prevProps, prevOwner) {
      var props = this.props;
      // If either the owner or a `ref` has changed, make sure the newest owner
      // has stored a reference to `this`, and the previous owner (if different)
      // has forgotten the reference to `this`.
      if (this._owner !== prevOwner || props.ref !== prevProps.ref) {
        if (prevProps.ref != null) {
          ReactOwner.removeComponentAsRefFrom(
            this, prevProps.ref, prevOwner
          );
        }
        // Correct, even if the owner is the same, and only the ref has changed.
        if (props.ref != null) {
          ReactOwner.addComponentAsRefTo(this, props.ref, this._owner);
        }
      }
    },

    /**
     * Mounts this component and inserts it into the DOM.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {boolean} shouldReuseMarkup If true, do not insert markup
     * @final
     * @internal
     * @see {ReactMount.renderComponent}
     */
    mountComponentIntoNode: function(rootID, container, shouldReuseMarkup) {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(
        this._mountComponentIntoNode,
        this,
        rootID,
        container,
        transaction,
        shouldReuseMarkup
      );
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {ReactReconcileTransaction} transaction
     * @param {boolean} shouldReuseMarkup If true, do not insert markup
     * @final
     * @private
     */
    _mountComponentIntoNode: function(
        rootID,
        container,
        transaction,
        shouldReuseMarkup) {
      var markup = this.mountComponent(rootID, transaction, 0);
      ReactComponent.mountImageIntoNode(markup, container, shouldReuseMarkup);
    },

    /**
     * Checks if this component is owned by the supplied `owner` component.
     *
     * @param {ReactComponent} owner Component to check.
     * @return {boolean} True if `owners` owns this component.
     * @final
     * @internal
     */
    isOwnedBy: function(owner) {
      return this._owner === owner;
    },

    /**
     * Gets another component, that shares the same owner as this one, by ref.
     *
     * @param {string} ref of a sibling Component.
     * @return {?ReactComponent} the actual sibling Component.
     * @final
     * @internal
     */
    getSiblingByRef: function(ref) {
      var owner = this._owner;
      if (!owner || !owner.refs) {
        return null;
      }
      return owner.refs[ref];
    }
  })
};

module.exports = ReactComponent;

},{"./ReactComponentEnvironment":28,"./ReactCurrentOwner":31,"./ReactOwner":59,"./ReactUpdates":70,"./invariant":108,"./keyMirror":114,"./merge":117}],27:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponentBrowserEnvironment
 */

/*jslint evil: true */

"use strict";

var ReactDOMIDOperations = require("./ReactDOMIDOperations");
var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");

var getReactRootElementInContainer = require("./getReactRootElementInContainer");
var invariant = require("./invariant");


var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;


/**
 * Abstracts away all functionality of `ReactComponent` requires knowledge of
 * the browser context.
 */
var ReactComponentBrowserEnvironment = {
  /**
   * Mixed into every component instance.
   */
  Mixin: {
    /**
     * Returns the DOM node rendered by this component.
     *
     * @return {DOMElement} The root node of this component.
     * @final
     * @protected
     */
    getDOMNode: function() {
      ("production" !== "development" ? invariant(
        this.isMounted(),
        'getDOMNode(): A component must be mounted to have a DOM node.'
      ) : invariant(this.isMounted()));
      return ReactMount.getNode(this._rootNodeID);
    }
  },

  ReactReconcileTransaction: ReactReconcileTransaction,

  BackendIDOperations: ReactDOMIDOperations,

  /**
   * If a particular environment requires that some resources be cleaned up,
   * specify this in the injected Mixin. In the DOM, we would likely want to
   * purge any cached node ID lookups.
   *
   * @private
   */
  unmountIDFromEnvironment: function(rootNodeID) {
    ReactMount.purgeID(rootNodeID);
  },

  /**
   * @param {string} markup Markup string to place into the DOM Element.
   * @param {DOMElement} container DOM Element to insert markup into.
   * @param {boolean} shouldReuseMarkup Should reuse the existing markup in the
   * container if possible.
   */
  mountImageIntoNode: ReactPerf.measure(
    'ReactComponentBrowserEnvironment',
    'mountImageIntoNode',
    function(markup, container, shouldReuseMarkup) {
      ("production" !== "development" ? invariant(
        container && (
          container.nodeType === ELEMENT_NODE_TYPE ||
            container.nodeType === DOC_NODE_TYPE
        ),
        'mountComponentIntoNode(...): Target container is not valid.'
      ) : invariant(container && (
        container.nodeType === ELEMENT_NODE_TYPE ||
          container.nodeType === DOC_NODE_TYPE
      )));

      if (shouldReuseMarkup) {
        if (ReactMarkupChecksum.canReuseMarkup(
          markup,
          getReactRootElementInContainer(container))) {
          return;
        } else {
          ("production" !== "development" ? invariant(
            container.nodeType !== DOC_NODE_TYPE,
            'You\'re trying to render a component to the document using ' +
            'server rendering but the checksum was invalid. This usually ' +
            'means you rendered a different component type or props on ' +
            'the client from the one on the server, or your render() ' +
            'methods are impure. React cannot handle this case due to ' +
            'cross-browser quirks by rendering at the document root. You ' +
            'should look for environment dependent code in your components ' +
            'and ensure the props are the same client and server side.'
          ) : invariant(container.nodeType !== DOC_NODE_TYPE));

          if ("production" !== "development") {
            console.warn(
              'React attempted to use reuse markup in a container but the ' +
              'checksum was invalid. This generally means that you are ' +
              'using server rendering and the markup generated on the ' +
              'server was not what the client was expecting. React injected' +
              'new markup to compensate which works but you have lost many ' +
              'of the benefits of server rendering. Instead, figure out ' +
              'why the markup being generated is different on the client ' +
              'or server.'
            );
          }
        }
      }

      ("production" !== "development" ? invariant(
        container.nodeType !== DOC_NODE_TYPE,
        'You\'re trying to render a component to the document but ' +
          'you didn\'t use server rendering. We can\'t do this ' +
          'without using server rendering due to cross-browser quirks. ' +
          'See renderComponentToString() for server rendering.'
      ) : invariant(container.nodeType !== DOC_NODE_TYPE));

      // Asynchronously inject markup by ensuring that the container is not in
      // the document when settings its `innerHTML`.
      var parent = container.parentNode;
      if (parent) {
        var next = container.nextSibling;
        parent.removeChild(container);
        container.innerHTML = markup;
        if (next) {
          parent.insertBefore(container, next);
        } else {
          parent.appendChild(container);
        }
      } else {
        container.innerHTML = markup;
      }
    }
  )
};

module.exports = ReactComponentBrowserEnvironment;

},{"./ReactDOMIDOperations":36,"./ReactMarkupChecksum":54,"./ReactMount":55,"./ReactPerf":60,"./ReactReconcileTransaction":66,"./getReactRootElementInContainer":104,"./invariant":108}],28:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponentEnvironment
 */

"use strict";

var ReactComponentBrowserEnvironment =
  require("./ReactComponentBrowserEnvironment");

var ReactComponentEnvironment = ReactComponentBrowserEnvironment;

module.exports = ReactComponentEnvironment;

},{"./ReactComponentBrowserEnvironment":27}],29:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactCompositeComponent
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactContext = require("./ReactContext");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactErrorUtils = require("./ReactErrorUtils");
var ReactOwner = require("./ReactOwner");
var ReactPerf = require("./ReactPerf");
var ReactPropTransferer = require("./ReactPropTransferer");
var ReactPropTypeLocations = require("./ReactPropTypeLocations");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");
var ReactUpdates = require("./ReactUpdates");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");
var mixInto = require("./mixInto");
var objMap = require("./objMap");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");

/**
 * Policies that describe methods in `ReactCompositeComponentInterface`.
 */
var SpecPolicy = keyMirror({
  /**
   * These methods may be defined only once by the class specification or mixin.
   */
  DEFINE_ONCE: null,
  /**
   * These methods may be defined by both the class specification and mixins.
   * Subsequent definitions will be chained. These methods must return void.
   */
  DEFINE_MANY: null,
  /**
   * These methods are overriding the base ReactCompositeComponent class.
   */
  OVERRIDE_BASE: null,
  /**
   * These methods are similar to DEFINE_MANY, except we assume they return
   * objects. We try to merge the keys of the return values of all the mixed in
   * functions. If there is a key conflict we throw.
   */
  DEFINE_MANY_MERGED: null
});

/**
 * Composite components are higher-level components that compose other composite
 * or native components.
 *
 * To create a new type of `ReactCompositeComponent`, pass a specification of
 * your new class to `React.createClass`. The only requirement of your class
 * specification is that you implement a `render` method.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return <div>Hello World</div>;
 *     }
 *   });
 *
 * The class specification supports a specific protocol of methods that have
 * special meaning (e.g. `render`). See `ReactCompositeComponentInterface` for
 * more the comprehensive protocol. Any other properties and methods in the
 * class specification will available on the prototype.
 *
 * @interface ReactCompositeComponentInterface
 * @internal
 */
var ReactCompositeComponentInterface = {

  /**
   * An array of Mixin objects to include when defining your component.
   *
   * @type {array}
   * @optional
   */
  mixins: SpecPolicy.DEFINE_MANY,

  /**
   * An object containing properties and methods that should be defined on
   * the component's constructor instead of its prototype (static methods).
   *
   * @type {object}
   * @optional
   */
  statics: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of prop types for this component.
   *
   * @type {object}
   * @optional
   */
  propTypes: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of context types for this component.
   *
   * @type {object}
   * @optional
   */
  contextTypes: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of context types this component sets for its children.
   *
   * @type {object}
   * @optional
   */
  childContextTypes: SpecPolicy.DEFINE_MANY,

  // ==== Definition methods ====

  /**
   * Invoked when the component is mounted. Values in the mapping will be set on
   * `this.props` if that prop is not specified (i.e. using an `in` check).
   *
   * This method is invoked before `getInitialState` and therefore cannot rely
   * on `this.state` or use `this.setState`.
   *
   * @return {object}
   * @optional
   */
  getDefaultProps: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * Invoked once before the component is mounted. The return value will be used
   * as the initial value of `this.state`.
   *
   *   getInitialState: function() {
   *     return {
   *       isOn: false,
   *       fooBaz: new BazFoo()
   *     }
   *   }
   *
   * @return {object}
   * @optional
   */
  getInitialState: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * @return {object}
   * @optional
   */
  getChildContext: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * Uses props from `this.props` and state from `this.state` to render the
   * structure of the component.
   *
   * No guarantees are made about when or how often this method is invoked, so
   * it must not have side effects.
   *
   *   render: function() {
   *     var name = this.props.name;
   *     return <div>Hello, {name}!</div>;
   *   }
   *
   * @return {ReactComponent}
   * @nosideeffects
   * @required
   */
  render: SpecPolicy.DEFINE_ONCE,



  // ==== Delegate methods ====

  /**
   * Invoked when the component is initially created and about to be mounted.
   * This may have side effects, but any external subscriptions or data created
   * by this method must be cleaned up in `componentWillUnmount`.
   *
   * @optional
   */
  componentWillMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component has been mounted and has a DOM representation.
   * However, there is no guarantee that the DOM node is in the document.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been mounted (initialized and rendered) for the first time.
   *
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked before the component receives new props.
   *
   * Use this as an opportunity to react to a prop transition by updating the
   * state using `this.setState`. Current props are accessed via `this.props`.
   *
   *   componentWillReceiveProps: function(nextProps, nextContext) {
   *     this.setState({
   *       likesIncreasing: nextProps.likeCount > this.props.likeCount
   *     });
   *   }
   *
   * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
   * transition may cause a state change, but the opposite is not true. If you
   * need it, you are probably looking for `componentWillUpdate`.
   *
   * @param {object} nextProps
   * @optional
   */
  componentWillReceiveProps: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked while deciding if the component should be updated as a result of
   * receiving new props, state and/or context.
   *
   * Use this as an opportunity to `return false` when you're certain that the
   * transition to the new props/state/context will not require a component
   * update.
   *
   *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
   *     return !equal(nextProps, this.props) ||
   *       !equal(nextState, this.state) ||
   *       !equal(nextContext, this.context);
   *   }
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @return {boolean} True if the component should update.
   * @optional
   */
  shouldComponentUpdate: SpecPolicy.DEFINE_ONCE,

  /**
   * Invoked when the component is about to update due to a transition from
   * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
   * and `nextContext`.
   *
   * Use this as an opportunity to perform preparation before an update occurs.
   *
   * NOTE: You **cannot** use `this.setState()` in this method.
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {?object} nextContext
   * @param {ReactReconcileTransaction} transaction
   * @optional
   */
  componentWillUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component's DOM representation has been updated.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been updated.
   *
   * @param {object} prevProps
   * @param {?object} prevState
   * @param {?object} prevContext
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component is about to be removed from its parent and have
   * its DOM representation destroyed.
   *
   * Use this as an opportunity to deallocate any external resources.
   *
   * NOTE: There is no `componentDidUnmount` since your component will have been
   * destroyed by that point.
   *
   * @optional
   */
  componentWillUnmount: SpecPolicy.DEFINE_MANY,



  // ==== Advanced methods ====

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @overridable
   */
  updateComponent: SpecPolicy.OVERRIDE_BASE

};

/**
 * Mapping from class specification keys to special processing functions.
 *
 * Although these are declared like instance properties in the specification
 * when defining classes using `React.createClass`, they are actually static
 * and are accessible on the constructor instead of the prototype. Despite
 * being static, they must be defined outside of the "statics" key under
 * which all other static methods are defined.
 */
var RESERVED_SPEC_KEYS = {
  displayName: function(ConvenienceConstructor, displayName) {
    ConvenienceConstructor.componentConstructor.displayName = displayName;
  },
  mixins: function(ConvenienceConstructor, mixins) {
    if (mixins) {
      for (var i = 0; i < mixins.length; i++) {
        mixSpecIntoComponent(ConvenienceConstructor, mixins[i]);
      }
    }
  },
  childContextTypes: function(ConvenienceConstructor, childContextTypes) {
    var Constructor = ConvenienceConstructor.componentConstructor;
    validateTypeDef(
      Constructor,
      childContextTypes,
      ReactPropTypeLocations.childContext
    );
    Constructor.childContextTypes = merge(
      Constructor.childContextTypes,
      childContextTypes
    );
  },
  contextTypes: function(ConvenienceConstructor, contextTypes) {
    var Constructor = ConvenienceConstructor.componentConstructor;
    validateTypeDef(
      Constructor,
      contextTypes,
      ReactPropTypeLocations.context
    );
    Constructor.contextTypes = merge(Constructor.contextTypes, contextTypes);
  },
  propTypes: function(ConvenienceConstructor, propTypes) {
    var Constructor = ConvenienceConstructor.componentConstructor;
    validateTypeDef(
      Constructor,
      propTypes,
      ReactPropTypeLocations.prop
    );
    Constructor.propTypes = merge(Constructor.propTypes, propTypes);
  },
  statics: function(ConvenienceConstructor, statics) {
    mixStaticSpecIntoComponent(ConvenienceConstructor, statics);
  }
};

function validateTypeDef(Constructor, typeDef, location) {
  for (var propName in typeDef) {
    if (typeDef.hasOwnProperty(propName)) {
      ("production" !== "development" ? invariant(
        typeof typeDef[propName] == 'function',
        '%s: %s type `%s` is invalid; it must be a function, usually from ' +
        'React.PropTypes.',
        Constructor.displayName || 'ReactCompositeComponent',
        ReactPropTypeLocationNames[location],
        propName
      ) : invariant(typeof typeDef[propName] == 'function'));
    }
  }
}

function validateMethodOverride(proto, name) {
  var specPolicy = ReactCompositeComponentInterface[name];

  // Disallow overriding of base class methods unless explicitly allowed.
  if (ReactCompositeComponentMixin.hasOwnProperty(name)) {
    ("production" !== "development" ? invariant(
      specPolicy === SpecPolicy.OVERRIDE_BASE,
      'ReactCompositeComponentInterface: You are attempting to override ' +
      '`%s` from your class specification. Ensure that your method names ' +
      'do not overlap with React methods.',
      name
    ) : invariant(specPolicy === SpecPolicy.OVERRIDE_BASE));
  }

  // Disallow defining methods more than once unless explicitly allowed.
  if (proto.hasOwnProperty(name)) {
    ("production" !== "development" ? invariant(
      specPolicy === SpecPolicy.DEFINE_MANY ||
      specPolicy === SpecPolicy.DEFINE_MANY_MERGED,
      'ReactCompositeComponentInterface: You are attempting to define ' +
      '`%s` on your component more than once. This conflict may be due ' +
      'to a mixin.',
      name
    ) : invariant(specPolicy === SpecPolicy.DEFINE_MANY ||
    specPolicy === SpecPolicy.DEFINE_MANY_MERGED));
  }
}

function validateLifeCycleOnReplaceState(instance) {
  var compositeLifeCycleState = instance._compositeLifeCycleState;
  ("production" !== "development" ? invariant(
    instance.isMounted() ||
      compositeLifeCycleState === CompositeLifeCycle.MOUNTING,
    'replaceState(...): Can only update a mounted or mounting component.'
  ) : invariant(instance.isMounted() ||
    compositeLifeCycleState === CompositeLifeCycle.MOUNTING));
  ("production" !== "development" ? invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE,
    'replaceState(...): Cannot update during an existing state transition ' +
    '(such as within `render`). This could potentially cause an infinite ' +
    'loop so it is forbidden.'
  ) : invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE));
  ("production" !== "development" ? invariant(compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING,
    'replaceState(...): Cannot update while unmounting component. This ' +
    'usually means you called setState() on an unmounted component.'
  ) : invariant(compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING));
}

/**
 * Custom version of `mixInto` which handles policy validation and reserved
 * specification keys when building `ReactCompositeComponent` classses.
 */
function mixSpecIntoComponent(ConvenienceConstructor, spec) {
  ("production" !== "development" ? invariant(
    !isValidClass(spec),
    'ReactCompositeComponent: You\'re attempting to ' +
    'use a component class as a mixin. Instead, just use a regular object.'
  ) : invariant(!isValidClass(spec)));
  ("production" !== "development" ? invariant(
    !ReactComponent.isValidComponent(spec),
    'ReactCompositeComponent: You\'re attempting to ' +
    'use a component as a mixin. Instead, just use a regular object.'
  ) : invariant(!ReactComponent.isValidComponent(spec)));

  var Constructor = ConvenienceConstructor.componentConstructor;
  var proto = Constructor.prototype;
  for (var name in spec) {
    var property = spec[name];
    if (!spec.hasOwnProperty(name)) {
      continue;
    }

    validateMethodOverride(proto, name);

    if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
      RESERVED_SPEC_KEYS[name](ConvenienceConstructor, property);
    } else {
      // Setup methods on prototype:
      // The following member methods should not be automatically bound:
      // 1. Expected ReactCompositeComponent methods (in the "interface").
      // 2. Overridden methods (that were mixed in).
      var isCompositeComponentMethod = name in ReactCompositeComponentInterface;
      var isInherited = name in proto;
      var markedDontBind = property && property.__reactDontBind;
      var isFunction = typeof property === 'function';
      var shouldAutoBind =
        isFunction &&
        !isCompositeComponentMethod &&
        !isInherited &&
        !markedDontBind;

      if (shouldAutoBind) {
        if (!proto.__reactAutoBindMap) {
          proto.__reactAutoBindMap = {};
        }
        proto.__reactAutoBindMap[name] = property;
        proto[name] = property;
      } else {
        if (isInherited) {
          // For methods which are defined more than once, call the existing
          // methods before calling the new property.
          if (ReactCompositeComponentInterface[name] ===
              SpecPolicy.DEFINE_MANY_MERGED) {
            proto[name] = createMergedResultFunction(proto[name], property);
          } else {
            proto[name] = createChainedFunction(proto[name], property);
          }
        } else {
          proto[name] = property;
        }
      }
    }
  }
}

function mixStaticSpecIntoComponent(ConvenienceConstructor, statics) {
  if (!statics) {
    return;
  }
  for (var name in statics) {
    var property = statics[name];
    if (!statics.hasOwnProperty(name) || !property) {
      return;
    }

    var isInherited = name in ConvenienceConstructor;
    var result = property;
    if (isInherited) {
      var existingProperty = ConvenienceConstructor[name];
      var existingType = typeof existingProperty;
      var propertyType = typeof property;
      ("production" !== "development" ? invariant(
        existingType === 'function' && propertyType === 'function',
        'ReactCompositeComponent: You are attempting to define ' +
        '`%s` on your component more than once, but that is only supported ' +
        'for functions, which are chained together. This conflict may be ' +
        'due to a mixin.',
        name
      ) : invariant(existingType === 'function' && propertyType === 'function'));
      result = createChainedFunction(existingProperty, property);
    }
    ConvenienceConstructor[name] = result;
    ConvenienceConstructor.componentConstructor[name] = result;
  }
}

/**
 * Merge two objects, but throw if both contain the same key.
 *
 * @param {object} one The first object, which is mutated.
 * @param {object} two The second object
 * @return {object} one after it has been mutated to contain everything in two.
 */
function mergeObjectsWithNoDuplicateKeys(one, two) {
  ("production" !== "development" ? invariant(
    one && two && typeof one === 'object' && typeof two === 'object',
    'mergeObjectsWithNoDuplicateKeys(): Cannot merge non-objects'
  ) : invariant(one && two && typeof one === 'object' && typeof two === 'object'));

  objMap(two, function(value, key) {
    ("production" !== "development" ? invariant(
      one[key] === undefined,
      'mergeObjectsWithNoDuplicateKeys(): ' +
      'Tried to merge two objects with the same key: %s',
      key
    ) : invariant(one[key] === undefined));
    one[key] = value;
  });
  return one;
}

/**
 * Creates a function that invokes two functions and merges their return values.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createMergedResultFunction(one, two) {
  return function mergedResult() {
    var a = one.apply(this, arguments);
    var b = two.apply(this, arguments);
    if (a == null) {
      return b;
    } else if (b == null) {
      return a;
    }
    return mergeObjectsWithNoDuplicateKeys(a, b);
  };
}

/**
 * Creates a function that invokes two functions and ignores their return vales.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createChainedFunction(one, two) {
  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

if ("production" !== "development") {

  var unmountedPropertyWhitelist = {
    constructor: true,
    construct: true,
    isOwnedBy: true, // should be deprecated but can have code mod (internal)
    mountComponent: true,
    mountComponentIntoNode: true,
    props: true,
    type: true,
    _checkPropTypes: true,
    _mountComponentIntoNode: true,
    _processContext: true
  };

  var hasWarnedOnComponentType = {};

  var warnIfUnmounted = function(instance, key) {
    if (instance.__hasBeenMounted) {
      return;
    }
    var name = instance.constructor.displayName || 'Unknown';
    var owner = ReactCurrentOwner.current;
    var ownerName = (owner && owner.constructor.displayName) || 'Unknown';
    var warningKey = key + '|' + name + '|' + ownerName;
    if (hasWarnedOnComponentType.hasOwnProperty(warningKey)) {
      // We have already warned for this combination. Skip it this time.
      return;
    }
    hasWarnedOnComponentType[warningKey] = true;

    var context = owner ? ' in ' + ownerName + '.' : ' at the top level.';
    var staticMethodExample = '<' + name + ' />.type.' + key + '(...)';

    console.warn(
      'Invalid access to component property "' + key + '" on ' + name +
      context + ' See http://fb.me/react-warning-descriptors .' +
      ' Use a static method instead: ' + staticMethodExample
    );
  };

  var defineMembraneProperty = function(membrane, prototype, key) {
    Object.defineProperty(membrane, key, {

      configurable: false,
      enumerable: true,

      get: function() {
        if (this !== membrane) {
          // When this is accessed through a prototype chain we need to check if
          // this component was mounted.
          warnIfUnmounted(this, key);
        }
        return prototype[key];
      },

      set: function(value) {
        if (this !== membrane) {
          // When this is accessed through a prototype chain, we first check if
          // this component was mounted. Then we define a value on "this"
          // instance, effectively disabling the membrane on that prototype
          // chain.
          warnIfUnmounted(this, key);
          Object.defineProperty(this, key, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
          });
        } else {
          // Otherwise, this should modify the prototype
          prototype[key] = value;
        }
      }

    });
  };

  /**
   * Creates a membrane prototype which wraps the original prototype. If any
   * property is accessed in an unmounted state, a warning is issued.
   *
   * @param {object} prototype Original prototype.
   * @return {object} The membrane prototype.
   * @private
   */
  var createMountWarningMembrane = function(prototype) {
    try {
      var membrane = Object.create(prototype);
      for (var key in prototype) {
        if (unmountedPropertyWhitelist.hasOwnProperty(key)) {
          continue;
        }
        defineMembraneProperty(membrane, prototype, key);
      }

      membrane.mountComponent = function() {
        this.__hasBeenMounted = true;
        return prototype.mountComponent.apply(this, arguments);
      };

      return membrane;
    } catch(x) {
      // In IE8 define property will fail on non-DOM objects. If anything in
      // the membrane creation fails, we'll bail out and just use the prototype
      // without warnings.
      return prototype;
    }
  };

}

/**
 * `ReactCompositeComponent` maintains an auxiliary life cycle state in
 * `this._compositeLifeCycleState` (which can be null).
 *
 * This is different from the life cycle state maintained by `ReactComponent` in
 * `this._lifeCycleState`. The following diagram shows how the states overlap in
 * time. There are times when the CompositeLifeCycle is null - at those times it
 * is only meaningful to look at ComponentLifeCycle alone.
 *
 * Top Row: ReactComponent.ComponentLifeCycle
 * Low Row: ReactComponent.CompositeLifeCycle
 *
 * +-------+------------------------------------------------------+--------+
 * |  UN   |                    MOUNTED                           |   UN   |
 * |MOUNTED|                                                      | MOUNTED|
 * +-------+------------------------------------------------------+--------+
 * |       ^--------+   +------+   +------+   +------+   +--------^        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |    0--|MOUNTING|-0-|RECEIV|-0-|RECEIV|-0-|RECEIV|-0-|   UN   |--->0   |
 * |       |        |   |PROPS |   | PROPS|   | STATE|   |MOUNTING|        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |       +--------+   +------+   +------+   +------+   +--------+        |
 * |       |                                                      |        |
 * +-------+------------------------------------------------------+--------+
 */
var CompositeLifeCycle = keyMirror({
  /**
   * Components in the process of being mounted respond to state changes
   * differently.
   */
  MOUNTING: null,
  /**
   * Components in the process of being unmounted are guarded against state
   * changes.
   */
  UNMOUNTING: null,
  /**
   * Components that are mounted and receiving new props respond to state
   * changes differently.
   */
  RECEIVING_PROPS: null,
  /**
   * Components that are mounted and receiving new state are guarded against
   * additional state changes.
   */
  RECEIVING_STATE: null
});

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponentMixin = {

  /**
   * Base constructor for all composite component.
   *
   * @param {?object} initialProps
   * @param {*} children
   * @final
   * @internal
   */
  construct: function(initialProps, children) {
    // Children can be either an array or more than one argument
    ReactComponent.Mixin.construct.apply(this, arguments);

    this.state = null;
    this._pendingState = null;

    this.context = this._processContext(ReactContext.current);
    this._currentContext = ReactContext.current;
    this._pendingContext = null;

    this._compositeLifeCycleState = null;
  },

  /**
   * Checks whether or not this composite component is mounted.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function() {
    return ReactComponent.Mixin.isMounted.call(this) &&
      this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING;
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction} transaction
   * @param {number} mountDepth number of components in the owner hierarchy
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'mountComponent',
    function(rootID, transaction, mountDepth) {
      ReactComponent.Mixin.mountComponent.call(
        this,
        rootID,
        transaction,
        mountDepth
      );
      this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;

      this._defaultProps = this.getDefaultProps ? this.getDefaultProps() : null;
      this.props = this._processProps(this.props);

      if (this.__reactAutoBindMap) {
        this._bindAutoBindMethods();
      }

      this.state = this.getInitialState ? this.getInitialState() : null;
      ("production" !== "development" ? invariant(
        typeof this.state === 'object' && !Array.isArray(this.state),
        '%s.getInitialState(): must return an object or null',
        this.constructor.displayName || 'ReactCompositeComponent'
      ) : invariant(typeof this.state === 'object' && !Array.isArray(this.state)));

      this._pendingState = null;
      this._pendingForceUpdate = false;

      if (this.componentWillMount) {
        this.componentWillMount();
        // When mounting, calls to `setState` by `componentWillMount` will set
        // `this._pendingState` without triggering a re-render.
        if (this._pendingState) {
          this.state = this._pendingState;
          this._pendingState = null;
        }
      }

      this._renderedComponent = this._renderValidatedComponent();

      // Done with mounting, `setState` will now trigger UI changes.
      this._compositeLifeCycleState = null;
      var markup = this._renderedComponent.mountComponent(
        rootID,
        transaction,
        mountDepth + 1
      );
      if (this.componentDidMount) {
        transaction.getReactMountReady().enqueue(this, this.componentDidMount);
      }
      return markup;
    }
  ),

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function() {
    this._compositeLifeCycleState = CompositeLifeCycle.UNMOUNTING;
    if (this.componentWillUnmount) {
      this.componentWillUnmount();
    }
    this._compositeLifeCycleState = null;

    this._defaultProps = null;

    this._renderedComponent.unmountComponent();
    this._renderedComponent = null;

    ReactComponent.Mixin.unmountComponent.call(this);

    if (this.refs) {
      this.refs = null;
    }

    // Some existing components rely on this.props even after they've been
    // destroyed (in event handlers).
    // TODO: this.props = null;
    // TODO: this.state = null;
  },

  /**
   * Sets a subset of the state. Always use this or `replaceState` to mutate
   * state. You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * There is no guarantee that calls to `setState` will run synchronously,
   * as they may eventually be batched together.  You can provide an optional
   * callback that will be executed when the call to setState is actually
   * completed.
   *
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  setState: function(partialState, callback) {
    ("production" !== "development" ? invariant(
      typeof partialState === 'object' || partialState == null,
      'setState(...): takes an object of state variables to update.'
    ) : invariant(typeof partialState === 'object' || partialState == null));
    if ("production" !== "development") {
      if (partialState == null) {
        console.warn(
          'setState(...): You passed an undefined or null state object; ' +
          'instead, use forceUpdate().'
        );
      }
    }
    // Merge with `_pendingState` if it exists, otherwise with existing state.
    this.replaceState(
      merge(this._pendingState || this.state, partialState),
      callback
    );
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {object} completeState Next state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  replaceState: function(completeState, callback) {
    validateLifeCycleOnReplaceState(this);
    this._pendingState = completeState;
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * Filters the context object to only contain keys specified in
   * `contextTypes`, and asserts that they are valid.
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _processContext: function(context) {
    var maskedContext = null;
    var contextTypes = this.constructor.contextTypes;
    if (contextTypes) {
      maskedContext = {};
      for (var contextName in contextTypes) {
        maskedContext[contextName] = context[contextName];
      }
      if ("production" !== "development") {
        this._checkPropTypes(
          contextTypes,
          maskedContext,
          ReactPropTypeLocations.context
        );
      }
    }
    return maskedContext;
  },

  /**
   * @param {object} currentContext
   * @return {object}
   * @private
   */
  _processChildContext: function(currentContext) {
    var childContext = this.getChildContext && this.getChildContext();
    var displayName = this.constructor.displayName || 'ReactCompositeComponent';
    if (childContext) {
      ("production" !== "development" ? invariant(
        typeof this.constructor.childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
        displayName
      ) : invariant(typeof this.constructor.childContextTypes === 'object'));
      if ("production" !== "development") {
        this._checkPropTypes(
          this.constructor.childContextTypes,
          childContext,
          ReactPropTypeLocations.childContext
        );
      }
      for (var name in childContext) {
        ("production" !== "development" ? invariant(
          name in this.constructor.childContextTypes,
          '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
          displayName,
          name
        ) : invariant(name in this.constructor.childContextTypes));
      }
      return merge(currentContext, childContext);
    }
    return currentContext;
  },

  /**
   * Processes props by setting default values for unspecified props and
   * asserting that the props are valid. Does not mutate its argument; returns
   * a new props object with defaults merged in.
   *
   * @param {object} newProps
   * @return {object}
   * @private
   */
  _processProps: function(newProps) {
    var props = merge(newProps);
    var defaultProps = this._defaultProps;
    for (var propName in defaultProps) {
      if (typeof props[propName] === 'undefined') {
        props[propName] = defaultProps[propName];
      }
    }
    if ("production" !== "development") {
      var propTypes = this.constructor.propTypes;
      if (propTypes) {
        this._checkPropTypes(propTypes, props, ReactPropTypeLocations.prop);
      }
    }
    return props;
  },

  /**
   * Assert that the props are valid
   *
   * @param {object} propTypes Map of prop name to a ReactPropType
   * @param {object} props
   * @param {string} location e.g. "prop", "context", "child context"
   * @private
   */
  _checkPropTypes: function(propTypes, props, location) {
    var componentName = this.constructor.displayName;
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        propTypes[propName](props, propName, componentName, location);
      }
    }
  },

  performUpdateIfNecessary: function() {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    // Do not trigger a state transition if we are in the middle of mounting or
    // receiving props because both of those will already be doing this.
    if (compositeLifeCycleState === CompositeLifeCycle.MOUNTING ||
        compositeLifeCycleState === CompositeLifeCycle.RECEIVING_PROPS) {
      return;
    }
    ReactComponent.Mixin.performUpdateIfNecessary.call(this);
  },

  /**
   * If any of `_pendingProps`, `_pendingState`, or `_pendingForceUpdate` is
   * set, update the component.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  _performUpdateIfNecessary: function(transaction) {
    if (this._pendingProps == null &&
        this._pendingState == null &&
        this._pendingContext == null &&
        !this._pendingForceUpdate) {
      return;
    }

    var nextFullContext = this._pendingContext || this._currentContext;
    var nextContext = this._processContext(nextFullContext);
    this._pendingContext = null;

    var nextProps = this.props;
    if (this._pendingProps != null) {
      nextProps = this._processProps(this._pendingProps);
      this._pendingProps = null;

      this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_PROPS;
      if (this.componentWillReceiveProps) {
        this.componentWillReceiveProps(nextProps, nextContext);
      }
    }

    this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_STATE;

    // Unlike props, state, and context, we specifically don't want to set
    // _pendingOwner to null here because it's possible for a component to have
    // a null owner, so we instead make `this._owner === this._pendingOwner`
    // mean that there's no owner change pending.
    var nextOwner = this._pendingOwner;

    var nextState = this._pendingState || this.state;
    this._pendingState = null;

    try {
      if (this._pendingForceUpdate ||
          !this.shouldComponentUpdate ||
          this.shouldComponentUpdate(nextProps, nextState, nextContext)) {
        this._pendingForceUpdate = false;
        // Will set `this.props`, `this.state` and `this.context`.
        this._performComponentUpdate(
          nextProps,
          nextOwner,
          nextState,
          nextFullContext,
          nextContext,
          transaction
        );
      } else {
        // If it's determined that a component should not update, we still want
        // to set props and state.
        this.props = nextProps;
        this._owner = nextOwner;
        this.state = nextState;
        this._currentContext = nextFullContext;
        this.context = nextContext;
      }
    } finally {
      this._compositeLifeCycleState = null;
    }
  },

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {object} nextProps Next object to set as properties.
   * @param {?ReactComponent} nextOwner Next component to set as owner
   * @param {?object} nextState Next object to set as state.
   * @param {?object} nextFullContext Next object to set as _currentContext.
   * @param {?object} nextContext Next object to set as context.
   * @param {ReactReconcileTransaction} transaction
   * @private
   */
  _performComponentUpdate: function(
    nextProps,
    nextOwner,
    nextState,
    nextFullContext,
    nextContext,
    transaction
  ) {
    var prevProps = this.props;
    var prevOwner = this._owner;
    var prevState = this.state;
    var prevContext = this.context;

    if (this.componentWillUpdate) {
      this.componentWillUpdate(nextProps, nextState, nextContext);
    }

    this.props = nextProps;
    this._owner = nextOwner;
    this.state = nextState;
    this._currentContext = nextFullContext;
    this.context = nextContext;

    this.updateComponent(
      transaction,
      prevProps,
      prevOwner,
      prevState,
      prevContext
    );

    if (this.componentDidUpdate) {
      transaction.getReactMountReady().enqueue(
        this,
        this.componentDidUpdate.bind(this, prevProps, prevState, prevContext)
      );
    }
  },

  receiveComponent: function(nextComponent, transaction) {
    if (nextComponent === this) {
      // Since props and context are immutable after the component is
      // mounted, we can do a cheap identity compare here to determine
      // if this is a superfluous reconcile.
      return;
    }

    this._pendingContext = nextComponent._currentContext;
    ReactComponent.Mixin.receiveComponent.call(
      this,
      nextComponent,
      transaction
    );
  },

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {object} prevProps
   * @param {?ReactComponent} prevOwner
   * @param {?object} prevState
   * @param {?object} prevContext
   * @internal
   * @overridable
   */
  updateComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'updateComponent',
    function(transaction, prevProps, prevOwner, prevState, prevContext) {
      ReactComponent.Mixin.updateComponent.call(
        this,
        transaction,
        prevProps,
        prevOwner
      );
      var prevComponent = this._renderedComponent;
      var nextComponent = this._renderValidatedComponent();
      if (shouldUpdateReactComponent(prevComponent, nextComponent)) {
        prevComponent.receiveComponent(nextComponent, transaction);
      } else {
        // These two IDs are actually the same! But nothing should rely on that.
        var thisID = this._rootNodeID;
        var prevComponentID = prevComponent._rootNodeID;
        prevComponent.unmountComponent();
        this._renderedComponent = nextComponent;
        var nextMarkup = nextComponent.mountComponent(
          thisID,
          transaction,
          this._mountDepth + 1
        );
        ReactComponent.BackendIDOperations.dangerouslyReplaceNodeWithMarkupByID(
          prevComponentID,
          nextMarkup
        );
      }
    }
  ),

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldUpdateComponent`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {?function} callback Called after update is complete.
   * @final
   * @protected
   */
  forceUpdate: function(callback) {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    ("production" !== "development" ? invariant(
      this.isMounted() ||
        compositeLifeCycleState === CompositeLifeCycle.MOUNTING,
      'forceUpdate(...): Can only force an update on mounted or mounting ' +
        'components.'
    ) : invariant(this.isMounted() ||
      compositeLifeCycleState === CompositeLifeCycle.MOUNTING));
    ("production" !== "development" ? invariant(
      compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
      compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING,
      'forceUpdate(...): Cannot force an update while unmounting component ' +
      'or during an existing state transition (such as within `render`).'
    ) : invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
    compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING));
    this._pendingForceUpdate = true;
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * @private
   */
  _renderValidatedComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    '_renderValidatedComponent',
    function() {
      var renderedComponent;
      var previousContext = ReactContext.current;
      ReactContext.current = this._processChildContext(this._currentContext);
      ReactCurrentOwner.current = this;
      try {
        renderedComponent = this.render();
      } finally {
        ReactContext.current = previousContext;
        ReactCurrentOwner.current = null;
      }
      ("production" !== "development" ? invariant(
        ReactComponent.isValidComponent(renderedComponent),
        '%s.render(): A valid ReactComponent must be returned. You may have ' +
          'returned null, undefined, an array, or some other invalid object.',
        this.constructor.displayName || 'ReactCompositeComponent'
      ) : invariant(ReactComponent.isValidComponent(renderedComponent)));
      return renderedComponent;
    }
  ),

  /**
   * @private
   */
  _bindAutoBindMethods: function() {
    for (var autoBindKey in this.__reactAutoBindMap) {
      if (!this.__reactAutoBindMap.hasOwnProperty(autoBindKey)) {
        continue;
      }
      var method = this.__reactAutoBindMap[autoBindKey];
      this[autoBindKey] = this._bindAutoBindMethod(ReactErrorUtils.guard(
        method,
        this.constructor.displayName + '.' + autoBindKey
      ));
    }
  },

  /**
   * Binds a method to the component.
   *
   * @param {function} method Method to be bound.
   * @private
   */
  _bindAutoBindMethod: function(method) {
    var component = this;
    var boundMethod = function() {
      return method.apply(component, arguments);
    };
    if ("production" !== "development") {
      boundMethod.__reactBoundContext = component;
      boundMethod.__reactBoundMethod = method;
      boundMethod.__reactBoundArguments = null;
      var componentName = component.constructor.displayName;
      var _bind = boundMethod.bind;
      boundMethod.bind = function(newThis ) {var args=Array.prototype.slice.call(arguments,1);
        // User is trying to bind() an autobound method; we effectively will
        // ignore the value of "this" that the user is trying to use, so
        // let's warn.
        if (newThis !== component && newThis !== null) {
          console.warn(
            'bind(): React component methods may only be bound to the ' +
            'component instance. See ' + componentName
          );
        } else if (!args.length) {
          console.warn(
            'bind(): You are binding a component method to the component. ' +
            'React does this for you automatically in a high-performance ' +
            'way, so you can safely remove this call. See ' + componentName
          );
          return boundMethod;
        }
        var reboundMethod = _bind.apply(boundMethod, arguments);
        reboundMethod.__reactBoundContext = component;
        reboundMethod.__reactBoundMethod = method;
        reboundMethod.__reactBoundArguments = args;
        return reboundMethod;
      };
    }
    return boundMethod;
  }
};

var ReactCompositeComponentBase = function() {};
mixInto(ReactCompositeComponentBase, ReactComponent.Mixin);
mixInto(ReactCompositeComponentBase, ReactOwner.Mixin);
mixInto(ReactCompositeComponentBase, ReactPropTransferer.Mixin);
mixInto(ReactCompositeComponentBase, ReactCompositeComponentMixin);

/**
 * Checks if a value is a valid component constructor.
 *
 * @param {*}
 * @return {boolean}
 * @public
 */
function isValidClass(componentClass) {
  return componentClass instanceof Function &&
         'componentConstructor' in componentClass &&
         componentClass.componentConstructor instanceof Function;
}
/**
 * Module for creating composite components.
 *
 * @class ReactCompositeComponent
 * @extends ReactComponent
 * @extends ReactOwner
 * @extends ReactPropTransferer
 */
var ReactCompositeComponent = {

  LifeCycle: CompositeLifeCycle,

  Base: ReactCompositeComponentBase,

  /**
   * Creates a composite component class given a class specification.
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  createClass: function(spec) {
    var Constructor = function() {};
    Constructor.prototype = new ReactCompositeComponentBase();
    Constructor.prototype.constructor = Constructor;

    var ConvenienceConstructor = function(props, children) {
      var instance = new Constructor();
      instance.construct.apply(instance, arguments);
      return instance;
    };
    ConvenienceConstructor.componentConstructor = Constructor;
    Constructor.ConvenienceConstructor = ConvenienceConstructor;
    ConvenienceConstructor.originalSpec = spec;

    mixSpecIntoComponent(ConvenienceConstructor, spec);

    ("production" !== "development" ? invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    ) : invariant(Constructor.prototype.render));

    if ("production" !== "development") {
      if (Constructor.prototype.componentShouldUpdate) {
        console.warn(
          (spec.displayName || 'A component') + ' has a method called ' +
          'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
          'The name is phrased as a question because the function is ' +
          'expected to return a value.'
         );
      }
    }

    // Expose the convience constructor on the prototype so that it can be
    // easily accessed on descriptors. E.g. <Foo />.type === Foo.type and for
    // static methods like <Foo />.type.staticMethod();
    // This should not be named constructor since this may not be the function
    // that created the descriptor, and it may not even be a constructor.
    ConvenienceConstructor.type = Constructor;
    Constructor.prototype.type = Constructor;

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactCompositeComponentInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    if ("production" !== "development") {
      Constructor.prototype = createMountWarningMembrane(Constructor.prototype);
    }

    return ConvenienceConstructor;
  },

  isValidClass: isValidClass
};

module.exports = ReactCompositeComponent;

},{"./ReactComponent":26,"./ReactContext":30,"./ReactCurrentOwner":31,"./ReactErrorUtils":47,"./ReactOwner":59,"./ReactPerf":60,"./ReactPropTransferer":61,"./ReactPropTypeLocationNames":62,"./ReactPropTypeLocations":63,"./ReactUpdates":70,"./invariant":108,"./keyMirror":114,"./merge":117,"./mixInto":120,"./objMap":121,"./shouldUpdateReactComponent":126}],30:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactContext
 */

"use strict";

var merge = require("./merge");

/**
 * Keeps track of the current context.
 *
 * The context is automatically passed down the component ownership hierarchy
 * and is accessible via `this.context` on ReactCompositeComponents.
 */
var ReactContext = {

  /**
   * @internal
   * @type {object}
   */
  current: {},

  /**
   * Temporarily extends the current context while executing scopedCallback.
   *
   * A typical use case might look like
   *
   *  render: function() {
   *    var children = ReactContext.withContext({foo: 'foo'} () => (
   *
   *    ));
   *    return <div>{children}</div>;
   *  }
   *
   * @param {object} newContext New context to merge into the existing context
   * @param {function} scopedCallback Callback to run with the new context
   * @return {ReactComponent|array<ReactComponent>}
   */
  withContext: function(newContext, scopedCallback) {
    var result;
    var previousContext = ReactContext.current;
    ReactContext.current = merge(previousContext, newContext);
    try {
      result = scopedCallback();
    } finally {
      ReactContext.current = previousContext;
    }
    return result;
  }

};

module.exports = ReactContext;

},{"./merge":117}],31:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactCurrentOwner
 */

"use strict";

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 *
 * The depth indicate how many composite components are above this render level.
 */
var ReactCurrentOwner = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null

};

module.exports = ReactCurrentOwner;

},{}],32:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOM
 * @typechecks static-only
 */

"use strict";

var ReactDOMComponent = require("./ReactDOMComponent");

var mergeInto = require("./mergeInto");
var objMapKeyVal = require("./objMapKeyVal");

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @param {string} tag Tag name (e.g. `div`).
 * @param {boolean} omitClose True if the close tag should be omitted.
 * @private
 */
function createDOMComponentClass(tag, omitClose) {
  var Constructor = function() {};
  Constructor.prototype = new ReactDOMComponent(tag, omitClose);
  Constructor.prototype.constructor = Constructor;
  Constructor.displayName = tag;

  var ConvenienceConstructor = function(props, children) {
    var instance = new Constructor();
    instance.construct.apply(instance, arguments);
    return instance;
  };

  // Expose the constructor on the ConvenienceConstructor and prototype so that
  // it can be easily easily accessed on descriptors.
  // E.g. <div />.type === div.type
  ConvenienceConstructor.type = Constructor;
  Constructor.prototype.type = Constructor;

  Constructor.ConvenienceConstructor = ConvenienceConstructor;
  ConvenienceConstructor.componentConstructor = Constructor;
  return ConvenienceConstructor;
}

/**
 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOM = objMapKeyVal({
  a: false,
  abbr: false,
  address: false,
  area: false,
  article: false,
  aside: false,
  audio: false,
  b: false,
  base: false,
  bdi: false,
  bdo: false,
  big: false,
  blockquote: false,
  body: false,
  br: true,
  button: false,
  canvas: false,
  caption: false,
  cite: false,
  code: false,
  col: true,
  colgroup: false,
  data: false,
  datalist: false,
  dd: false,
  del: false,
  details: false,
  dfn: false,
  div: false,
  dl: false,
  dt: false,
  em: false,
  embed: true,
  fieldset: false,
  figcaption: false,
  figure: false,
  footer: false,
  form: false, // NOTE: Injected, see `ReactDOMForm`.
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  h5: false,
  h6: false,
  head: false,
  header: false,
  hr: true,
  html: false,
  i: false,
  iframe: false,
  img: true,
  input: true,
  ins: false,
  kbd: false,
  keygen: true,
  label: false,
  legend: false,
  li: false,
  link: false,
  main: false,
  map: false,
  mark: false,
  menu: false,
  menuitem: false, // NOTE: Close tag should be omitted, but causes problems.
  meta: true,
  meter: false,
  nav: false,
  noscript: false,
  object: false,
  ol: false,
  optgroup: false,
  option: false,
  output: false,
  p: false,
  param: true,
  pre: false,
  progress: false,
  q: false,
  rp: false,
  rt: false,
  ruby: false,
  s: false,
  samp: false,
  script: false,
  section: false,
  select: false,
  small: false,
  source: false,
  span: false,
  strong: false,
  style: false,
  sub: false,
  summary: false,
  sup: false,
  table: false,
  tbody: false,
  td: false,
  textarea: false, // NOTE: Injected, see `ReactDOMTextarea`.
  tfoot: false,
  th: false,
  thead: false,
  time: false,
  title: false,
  tr: false,
  track: true,
  u: false,
  ul: false,
  'var': false,
  video: false,
  wbr: false,

  // SVG
  circle: false,
  defs: false,
  g: false,
  line: false,
  linearGradient: false,
  path: false,
  polygon: false,
  polyline: false,
  radialGradient: false,
  rect: false,
  stop: false,
  svg: false,
  text: false
}, createDOMComponentClass);

var injection = {
  injectComponentClasses: function(componentClasses) {
    mergeInto(ReactDOM, componentClasses);
  }
};

ReactDOM.injection = injection;

module.exports = ReactDOM;

},{"./ReactDOMComponent":34,"./mergeInto":119,"./objMapKeyVal":122}],33:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMButton
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var keyMirror = require("./keyMirror");

// Store a reference to the <button> `ReactDOMComponent`.
var button = ReactDOM.button;

var mouseListenerNames = keyMirror({
  onClick: true,
  onDoubleClick: true,
  onMouseDown: true,
  onMouseMove: true,
  onMouseUp: true,
  onClickCapture: true,
  onDoubleClickCapture: true,
  onMouseDownCapture: true,
  onMouseMoveCapture: true,
  onMouseUpCapture: true
});

/**
 * Implements a <button> native component that does not receive mouse events
 * when `disabled` is set.
 */
var ReactDOMButton = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMButton',

  mixins: [AutoFocusMixin],

  render: function() {
    var props = {};

    // Copy the props; except the mouse listeners if we're disabled
    for (var key in this.props) {
      if (this.props.hasOwnProperty(key) &&
          (!this.props.disabled || !mouseListenerNames[key])) {
        props[key] = this.props[key];
      }
    }

    return button(props, this.props.children);
  }

});

module.exports = ReactDOMButton;

},{"./AutoFocusMixin":1,"./ReactCompositeComponent":29,"./ReactDOM":32,"./keyMirror":114}],34:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMComponent
 * @typechecks static-only
 */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMProperty = require("./DOMProperty");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponent = require("./ReactComponent");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactMount = require("./ReactMount");
var ReactMultiChild = require("./ReactMultiChild");
var ReactPerf = require("./ReactPerf");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var invariant = require("./invariant");
var keyOf = require("./keyOf");
var merge = require("./merge");
var mixInto = require("./mixInto");

var deleteListener = ReactEventEmitter.deleteListener;
var listenTo = ReactEventEmitter.listenTo;
var registrationNameModules = ReactEventEmitter.registrationNameModules;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var STYLE = keyOf({style: null});

var ELEMENT_NODE_TYPE = 1;

/**
 * @param {?object} props
 */
function assertValidProps(props) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  ("production" !== "development" ? invariant(
    props.children == null || props.dangerouslySetInnerHTML == null,
    'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'
  ) : invariant(props.children == null || props.dangerouslySetInnerHTML == null));
  ("production" !== "development" ? invariant(
    props.style == null || typeof props.style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
    'not a string.'
  ) : invariant(props.style == null || typeof props.style === 'object'));
}

function putListener(id, registrationName, listener, transaction) {
  var container = ReactMount.findReactContainerForID(id);
  if (container) {
    var doc = container.nodeType === ELEMENT_NODE_TYPE ?
      container.ownerDocument :
      container;
    listenTo(registrationName, doc);
  }
  transaction.getPutListenerQueue().enqueuePutListener(
    id,
    registrationName,
    listener
  );
}


/**
 * @constructor ReactDOMComponent
 * @extends ReactComponent
 * @extends ReactMultiChild
 */
function ReactDOMComponent(tag, omitClose) {
  this._tagOpen = '<' + tag;
  this._tagClose = omitClose ? '' : '</' + tag + '>';
  this.tagName = tag.toUpperCase();
}

ReactDOMComponent.Mixin = {

  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {string} rootID The root DOM ID for this node.
   * @param {ReactReconcileTransaction} transaction
   * @param {number} mountDepth number of components in the owner hierarchy
   * @return {string} The computed markup.
   */
  mountComponent: ReactPerf.measure(
    'ReactDOMComponent',
    'mountComponent',
    function(rootID, transaction, mountDepth) {
      ReactComponent.Mixin.mountComponent.call(
        this,
        rootID,
        transaction,
        mountDepth
      );
      assertValidProps(this.props);
      return (
        this._createOpenTagMarkupAndPutListeners(transaction) +
        this._createContentMarkup(transaction) +
        this._tagClose
      );
    }
  ),

  /**
   * Creates markup for the open tag and all attributes.
   *
   * This method has side effects because events get registered.
   *
   * Iterating over object properties is faster than iterating over arrays.
   * @see http://jsperf.com/obj-vs-arr-iteration
   *
   * @private
   * @param {ReactReconcileTransaction} transaction
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkupAndPutListeners: function(transaction) {
    var props = this.props;
    var ret = this._tagOpen;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNameModules[propKey]) {
        putListener(this._rootNodeID, propKey, propValue, transaction);
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            propValue = props.style = merge(props.style);
          }
          propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
        }
        var markup =
          DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    var idMarkup = DOMPropertyOperations.createMarkupForID(this._rootNodeID);
    return ret + ' ' + idMarkup + '>';
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction} transaction
   * @return {string} Content markup.
   */
  _createContentMarkup: function(transaction) {
    // Intentional use of != to avoid catching zero/false.
    var innerHTML = this.props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        return innerHTML.__html;
      }
    } else {
      var contentToUse =
        CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;
      var childrenToUse = contentToUse != null ? null : this.props.children;
      if (contentToUse != null) {
        return escapeTextForBrowser(contentToUse);
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(
          childrenToUse,
          transaction
        );
        return mountImages.join('');
      }
    }
    return '';
  },

  receiveComponent: function(nextComponent, transaction) {
    assertValidProps(nextComponent.props);
    ReactComponent.Mixin.receiveComponent.call(
      this,
      nextComponent,
      transaction
    );
  },

  /**
   * Updates a native DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {object} prevProps
   * @internal
   * @overridable
   */
  updateComponent: ReactPerf.measure(
    'ReactDOMComponent',
    'updateComponent',
    function(transaction, prevProps, prevOwner) {
      ReactComponent.Mixin.updateComponent.call(
        this,
        transaction,
        prevProps,
        prevOwner
      );
      this._updateDOMProperties(prevProps, transaction);
      this._updateDOMChildren(prevProps, transaction);
    }
  ),

  /**
   * Reconciles the properties by detecting differences in property values and
   * updating the DOM as necessary. This function is probably the single most
   * critical path for performance optimization.
   *
   * TODO: Benchmark whether checking for changed values in memory actually
   *       improves performance (especially statically positioned elements).
   * TODO: Benchmark the effects of putting this at the top since 99% of props
   *       do not change for a given reconciliation.
   * TODO: Benchmark areas that can be improved with caching.
   *
   * @private
   * @param {object} lastProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMProperties: function(lastProps, transaction) {
    var nextProps = this.props;
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) ||
         !lastProps.hasOwnProperty(propKey)) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = lastProps[propKey];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
      } else if (registrationNameModules[propKey]) {
        deleteListener(this._rootNodeID, propKey);
      } else if (
          DOMProperty.isStandardName[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        ReactComponent.BackendIDOperations.deletePropertyByID(
          this._rootNodeID,
          propKey
        );
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = lastProps[propKey];
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
        continue;
      }
      if (propKey === STYLE) {
        if (nextProp) {
          nextProp = nextProps.style = merge(nextProp);
        }
        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) &&
                !nextProp.hasOwnProperty(styleName)) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) &&
                lastProp[styleName] !== nextProp[styleName]) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          styleUpdates = nextProp;
        }
      } else if (registrationNameModules[propKey]) {
        putListener(this._rootNodeID, propKey, nextProp, transaction);
      } else if (
          DOMProperty.isStandardName[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        ReactComponent.BackendIDOperations.updatePropertyByID(
          this._rootNodeID,
          propKey,
          nextProp
        );
      }
    }
    if (styleUpdates) {
      ReactComponent.BackendIDOperations.updateStylesByID(
        this._rootNodeID,
        styleUpdates
      );
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} lastProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMChildren: function(lastProps, transaction) {
    var nextProps = this.props;

    var lastContent =
      CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
    var nextContent =
      CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

    var lastHtml =
      lastProps.dangerouslySetInnerHTML &&
      lastProps.dangerouslySetInnerHTML.__html;
    var nextHtml =
      nextProps.dangerouslySetInnerHTML &&
      nextProps.dangerouslySetInnerHTML.__html;

    // Note the use of `!=` which checks for null or undefined.
    var lastChildren = lastContent != null ? null : lastProps.children;
    var nextChildren = nextContent != null ? null : nextProps.children;

    // If we're switching from children to content/html or vice versa, remove
    // the old content
    var lastHasContentOrHtml = lastContent != null || lastHtml != null;
    var nextHasContentOrHtml = nextContent != null || nextHtml != null;
    if (lastChildren != null && nextChildren == null) {
      this.updateChildren(null, transaction);
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('');
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent('' + nextContent);
      }
    } else if (nextHtml != null) {
      if (lastHtml !== nextHtml) {
        ReactComponent.BackendIDOperations.updateInnerHTMLByID(
          this._rootNodeID,
          nextHtml
        );
      }
    } else if (nextChildren != null) {
      this.updateChildren(nextChildren, transaction);
    }
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function() {
    this.unmountChildren();
    ReactEventEmitter.deleteAllListeners(this._rootNodeID);
    ReactComponent.Mixin.unmountComponent.call(this);
  }

};

mixInto(ReactDOMComponent, ReactComponent.Mixin);
mixInto(ReactDOMComponent, ReactDOMComponent.Mixin);
mixInto(ReactDOMComponent, ReactMultiChild.Mixin);

module.exports = ReactDOMComponent;

},{"./CSSPropertyOperations":3,"./DOMProperty":8,"./DOMPropertyOperations":9,"./ReactComponent":26,"./ReactEventEmitter":48,"./ReactMount":55,"./ReactMultiChild":57,"./ReactPerf":60,"./escapeTextForBrowser":96,"./invariant":108,"./keyOf":115,"./merge":117,"./mixInto":120}],35:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMForm
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactEventEmitter = require("./ReactEventEmitter");
var EventConstants = require("./EventConstants");

// Store a reference to the <form> `ReactDOMComponent`.
var form = ReactDOM.form;

/**
 * Since onSubmit doesn't bubble OR capture on the top level in IE8, we need
 * to capture it on the <form> element itself. There are lots of hacks we could
 * do to accomplish this, but the most reliable is to make <form> a
 * composite component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMForm = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMForm',

  render: function() {
    // TODO: Instead of using `ReactDOM` directly, we should use JSX. However,
    // `jshint` fails to parse JSX so in order for linting to work in the open
    // source repo, we need to just use `ReactDOM.form`.
    return this.transferPropsTo(form(null, this.props.children));
  },

  componentDidMount: function() {
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topReset,
      'reset',
      this.getDOMNode()
    );
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topSubmit,
      'submit',
      this.getDOMNode()
    );
  }
});

module.exports = ReactDOMForm;

},{"./EventConstants":14,"./ReactCompositeComponent":29,"./ReactDOM":32,"./ReactEventEmitter":48}],36:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMIDOperations
 * @typechecks static-only
 */

/*jslint evil: true */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMChildrenOperations = require("./DOMChildrenOperations");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");

var invariant = require("./invariant");

/**
 * Errors for properties that should not be updated with `updatePropertyById()`.
 *
 * @type {object}
 * @private
 */
var INVALID_PROPERTY_ERRORS = {
  dangerouslySetInnerHTML:
    '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
  style: '`style` must be set using `updateStylesByID()`.'
};

var useWhitespaceWorkaround;

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactComponent.BackendIDOperations`.
 */
var ReactDOMIDOperations = {

  /**
   * Updates a DOM node with new property values. This should only be used to
   * update DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A valid property name, see `DOMProperty`.
   * @param {*} value New value of the property.
   * @internal
   */
  updatePropertyByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updatePropertyByID',
    function(id, name, value) {
      var node = ReactMount.getNode(id);
      ("production" !== "development" ? invariant(
        !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
        'updatePropertyByID(...): %s',
        INVALID_PROPERTY_ERRORS[name]
      ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));

      // If we're updating to null or undefined, we should remove the property
      // from the DOM node instead of inadvertantly setting to a string. This
      // brings us in line with the same behavior we have on initial render.
      if (value != null) {
        DOMPropertyOperations.setValueForProperty(node, name, value);
      } else {
        DOMPropertyOperations.deleteValueForProperty(node, name);
      }
    }
  ),

  /**
   * Updates a DOM node to remove a property. This should only be used to remove
   * DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A property name to remove, see `DOMProperty`.
   * @internal
   */
  deletePropertyByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'deletePropertyByID',
    function(id, name, value) {
      var node = ReactMount.getNode(id);
      ("production" !== "development" ? invariant(
        !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
        'updatePropertyByID(...): %s',
        INVALID_PROPERTY_ERRORS[name]
      ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));
      DOMPropertyOperations.deleteValueForProperty(node, name, value);
    }
  ),

  /**
   * Updates a DOM node with new style values. If a value is specified as '',
   * the corresponding style property will be unset.
   *
   * @param {string} id ID of the node to update.
   * @param {object} styles Mapping from styles to values.
   * @internal
   */
  updateStylesByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updateStylesByID',
    function(id, styles) {
      var node = ReactMount.getNode(id);
      CSSPropertyOperations.setValueForStyles(node, styles);
    }
  ),

  /**
   * Updates a DOM node's innerHTML.
   *
   * @param {string} id ID of the node to update.
   * @param {string} html An HTML string.
   * @internal
   */
  updateInnerHTMLByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updateInnerHTMLByID',
    function(id, html) {
      var node = ReactMount.getNode(id);

      // IE8: When updating a just created node with innerHTML only leading
      // whitespace is removed. When updating an existing node with innerHTML
      // whitespace in root TextNodes is also collapsed.
      // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html

      if (useWhitespaceWorkaround === undefined) {
        // Feature detection; only IE8 is known to behave improperly like this.
        var temp = document.createElement('div');
        temp.innerHTML = ' ';
        useWhitespaceWorkaround = temp.innerHTML === '';
      }

      if (useWhitespaceWorkaround) {
        // Magic theory: IE8 supposedly differentiates between added and updated
        // nodes when processing innerHTML, innerHTML on updated nodes suffers
        // from worse whitespace behavior. Re-adding a node like this triggers
        // the initial and more favorable whitespace behavior.
        node.parentNode.replaceChild(node, node);
      }

      if (useWhitespaceWorkaround && html.match(/^[ \r\n\t\f]/)) {
        // Recover leading whitespace by temporarily prepending any character.
        // \uFEFF has the potential advantage of being zero-width/invisible.
        node.innerHTML = '\uFEFF' + html;
        node.firstChild.deleteData(0, 1);
      } else {
        node.innerHTML = html;
      }
    }
  ),

  /**
   * Updates a DOM node's text content set by `props.content`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} content Text content.
   * @internal
   */
  updateTextContentByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'updateTextContentByID',
    function(id, content) {
      var node = ReactMount.getNode(id);
      DOMChildrenOperations.updateTextContent(node, content);
    }
  ),

  /**
   * Replaces a DOM node that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Dangerous markup to inject in place of child.
   * @internal
   * @see {Danger.dangerouslyReplaceNodeWithMarkup}
   */
  dangerouslyReplaceNodeWithMarkupByID: ReactPerf.measure(
    'ReactDOMIDOperations',
    'dangerouslyReplaceNodeWithMarkupByID',
    function(id, markup) {
      var node = ReactMount.getNode(id);
      DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
    }
  ),

  /**
   * Updates a component's children by processing a series of updates.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markup List of markup strings.
   * @internal
   */
  dangerouslyProcessChildrenUpdates: ReactPerf.measure(
    'ReactDOMIDOperations',
    'dangerouslyProcessChildrenUpdates',
    function(updates, markup) {
      for (var i = 0; i < updates.length; i++) {
        updates[i].parentNode = ReactMount.getNode(updates[i].parentID);
      }
      DOMChildrenOperations.processUpdates(updates, markup);
    }
  )
};

module.exports = ReactDOMIDOperations;

},{"./CSSPropertyOperations":3,"./DOMChildrenOperations":7,"./DOMPropertyOperations":9,"./ReactMount":55,"./ReactPerf":60,"./invariant":108}],37:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMImg
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactEventEmitter = require("./ReactEventEmitter");
var EventConstants = require("./EventConstants");

// Store a reference to the <img> `ReactDOMComponent`.
var img = ReactDOM.img;

/**
 * Since onLoad doesn't bubble OR capture on the top level in IE8, we need to
 * capture it on the <img> element itself. There are lots of hacks we could do
 * to accomplish this, but the most reliable is to make <img> a composite
 * component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMImg = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMImg',
  tagName: 'IMG',

  render: function() {
    return img(this.props);
  },

  componentDidMount: function() {
    var node = this.getDOMNode();
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topLoad,
      'load',
      node
    );
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topError,
      'error',
      node
    );
  }
});

module.exports = ReactDOMImg;

},{"./EventConstants":14,"./ReactCompositeComponent":29,"./ReactDOM":32,"./ReactEventEmitter":48}],38:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMInput
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactMount = require("./ReactMount");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <input> `ReactDOMComponent`.
var input = ReactDOM.input;

var instancesByReactID = {};

/**
 * Implements an <input> native component that allows setting these optional
 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
 *
 * If `checked` or `value` are not supplied (or null/undefined), user actions
 * that affect the checked state or value will trigger updates to the element.
 *
 * If they are supplied (and not null/undefined), the rendered element will not
 * trigger updates to the element. Instead, the props must change in order for
 * the rendered element to be updated.
 *
 * The rendered element will be initialized as unchecked (or `defaultChecked`)
 * with an empty value (or `defaultValue`).
 *
 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */
var ReactDOMInput = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMInput',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin],

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    return {
      checked: this.props.defaultChecked || false,
      value: defaultValue != null ? defaultValue : null
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.defaultChecked = null;
    props.defaultValue = null;

    var value = LinkedValueUtils.getValue(this);
    props.value = value != null ? value : this.state.value;

    var checked = LinkedValueUtils.getChecked(this);
    props.checked = checked != null ? checked : this.state.checked;

    props.onChange = this._handleChange;

    return input(props, this.props.children);
  },

  componentDidMount: function() {
    var id = ReactMount.getID(this.getDOMNode());
    instancesByReactID[id] = this;
  },

  componentWillUnmount: function() {
    var rootNode = this.getDOMNode();
    var id = ReactMount.getID(rootNode);
    delete instancesByReactID[id];
  },

  componentDidUpdate: function(prevProps, prevState, prevContext) {
    var rootNode = this.getDOMNode();
    if (this.props.checked != null) {
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'checked',
        this.props.checked || false
      );
    }

    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      this._isChanging = true;
      returnValue = onChange.call(this, event);
      this._isChanging = false;
    }
    this.setState({
      checked: event.target.checked,
      value: event.target.value
    });

    var name = this.props.name;
    if (this.props.type === 'radio' && name != null) {
      var rootNode = this.getDOMNode();
      var queryRoot = rootNode;

      while (queryRoot.parentNode) {
        queryRoot = queryRoot.parentNode;
      }

      // If `rootNode.form` was non-null, then we could try `form.elements`,
      // but that sometimes behaves strangely in IE8. We could also try using
      // `form.getElementsByName`, but that will only return direct children
      // and won't include inputs that use the HTML5 `form=` attribute. Since
      // the input might not even be in a form, let's just use the global
      // `querySelectorAll` to ensure we don't miss anything.
      var group = queryRoot.querySelectorAll(
        'input[name=' + JSON.stringify('' + name) + '][type="radio"]');

      for (var i = 0, groupLen = group.length; i < groupLen; i++) {
        var otherNode = group[i];
        if (otherNode === rootNode ||
            otherNode.form !== rootNode.form) {
          continue;
        }
        var otherID = ReactMount.getID(otherNode);
        ("production" !== "development" ? invariant(
          otherID,
          'ReactDOMInput: Mixing React and non-React radio inputs with the ' +
          'same `name` is not supported.'
        ) : invariant(otherID));
        var otherInstance = instancesByReactID[otherID];
        ("production" !== "development" ? invariant(
          otherInstance,
          'ReactDOMInput: Unknown radio button ID %s.',
          otherID
        ) : invariant(otherInstance));
        // In some cases, this will actually change the `checked` state value.
        // In other cases, there's no change but this forces a reconcile upon
        // which componentDidUpdate will reset the DOM property to whatever it
        // should be.
        otherInstance.setState({
          checked: false
        });
      }
    }

    return returnValue;
  }

});

module.exports = ReactDOMInput;

},{"./AutoFocusMixin":1,"./DOMPropertyOperations":9,"./LinkedValueUtils":21,"./ReactCompositeComponent":29,"./ReactDOM":32,"./ReactMount":55,"./invariant":108,"./merge":117}],39:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMOption
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

// Store a reference to the <option> `ReactDOMComponent`.
var option = ReactDOM.option;

/**
 * Implements an <option> native component that warns when `selected` is set.
 */
var ReactDOMOption = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMOption',

  componentWillMount: function() {
    // TODO (yungsters): Remove support for `selected` in <option>.
    if (this.props.selected != null) {
      if ("production" !== "development") {
        console.warn(
          'Use the `defaultValue` or `value` props on <select> instead of ' +
          'setting `selected` on <option>.'
        );
      }
    }
  },

  render: function() {
    return option(this.props, this.props.children);
  }

});

module.exports = ReactDOMOption;

},{"./ReactCompositeComponent":29,"./ReactDOM":32}],40:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMSelect
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <select> `ReactDOMComponent`.
var select = ReactDOM.select;

/**
 * Validation function for `value` and `defaultValue`.
 * @private
 */
function selectValueType(props, propName, componentName) {
  if (props[propName] == null) {
    return;
  }
  if (props.multiple) {
    ("production" !== "development" ? invariant(
      Array.isArray(props[propName]),
      'The `%s` prop supplied to <select> must be an array if `multiple` is ' +
      'true.',
      propName
    ) : invariant(Array.isArray(props[propName])));
  } else {
    ("production" !== "development" ? invariant(
      !Array.isArray(props[propName]),
      'The `%s` prop supplied to <select> must be a scalar value if ' +
      '`multiple` is false.',
      propName
    ) : invariant(!Array.isArray(props[propName])));
  }
}

/**
 * If `value` is supplied, updates <option> elements on mount and update.
 * @param {ReactComponent} component Instance of ReactDOMSelect
 * @param {?*} propValue For uncontrolled components, null/undefined. For
 * controlled components, a string (or with `multiple`, a list of strings).
 * @private
 */
function updateOptions(component, propValue) {
  var multiple = component.props.multiple;
  var value = propValue != null ? propValue : component.state.value;
  var options = component.getDOMNode().options;
  var selectedValue, i, l;
  if (multiple) {
    selectedValue = {};
    for (i = 0, l = value.length; i < l; ++i) {
      selectedValue['' + value[i]] = true;
    }
  } else {
    selectedValue = '' + value;
  }
  for (i = 0, l = options.length; i < l; i++) {
    var selected = multiple ?
      selectedValue.hasOwnProperty(options[i].value) :
      options[i].value === selectedValue;

    if (selected !== options[i].selected) {
      options[i].selected = selected;
    }
  }
}

/**
 * Implements a <select> native component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * string. If `multiple` is true, the prop must be an array of strings.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
var ReactDOMSelect = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMSelect',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin],

  propTypes: {
    defaultValue: selectValueType,
    value: selectValueType
  },

  getInitialState: function() {
    return {value: this.props.defaultValue || (this.props.multiple ? [] : '')};
  },

  componentWillReceiveProps: function(nextProps) {
    if (!this.props.multiple && nextProps.multiple) {
      this.setState({value: [this.state.value]});
    } else if (this.props.multiple && !nextProps.multiple) {
      this.setState({value: this.state.value[0]});
    }
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.onChange = this._handleChange;
    props.value = null;

    return select(props, this.props.children);
  },

  componentDidMount: function() {
    updateOptions(this, LinkedValueUtils.getValue(this));
  },

  componentDidUpdate: function() {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      updateOptions(this, value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      this._isChanging = true;
      returnValue = onChange.call(this, event);
      this._isChanging = false;
    }

    var selectedValue;
    if (this.props.multiple) {
      selectedValue = [];
      var options = event.target.options;
      for (var i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
          selectedValue.push(options[i].value);
        }
      }
    } else {
      selectedValue = event.target.value;
    }

    this.setState({value: selectedValue});
    return returnValue;
  }

});

module.exports = ReactDOMSelect;

},{"./AutoFocusMixin":1,"./LinkedValueUtils":21,"./ReactCompositeComponent":29,"./ReactDOM":32,"./invariant":108,"./merge":117}],41:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMSelection
 */

"use strict";

var getNodeForCharacterOffset = require("./getNodeForCharacterOffset");
var getTextContentAccessor = require("./getTextContentAccessor");

/**
 * Get the appropriate anchor and focus node/offset pairs for IE.
 *
 * The catch here is that IE's selection API doesn't provide information
 * about whether the selection is forward or backward, so we have to
 * behave as though it's always forward.
 *
 * IE text differs from modern selection in that it behaves as though
 * block elements end with a new line. This means character offsets will
 * differ between the two APIs.
 *
 * @param {DOMElement} node
 * @return {object}
 */
function getIEOffsets(node) {
  var selection = document.selection;
  var selectedRange = selection.createRange();
  var selectedLength = selectedRange.text.length;

  // Duplicate selection so we can move range without breaking user selection.
  var fromStart = selectedRange.duplicate();
  fromStart.moveToElementText(node);
  fromStart.setEndPoint('EndToStart', selectedRange);

  var startOffset = fromStart.text.length;
  var endOffset = startOffset + selectedLength;

  return {
    start: startOffset,
    end: endOffset
  };
}

/**
 * @param {DOMElement} node
 * @return {?object}
 */
function getModernOffsets(node) {
  var selection = window.getSelection();

  if (selection.rangeCount === 0) {
    return null;
  }

  var anchorNode = selection.anchorNode;
  var anchorOffset = selection.anchorOffset;
  var focusNode = selection.focusNode;
  var focusOffset = selection.focusOffset;

  var currentRange = selection.getRangeAt(0);
  var rangeLength = currentRange.toString().length;

  var tempRange = currentRange.cloneRange();
  tempRange.selectNodeContents(node);
  tempRange.setEnd(currentRange.startContainer, currentRange.startOffset);

  var start = tempRange.toString().length;
  var end = start + rangeLength;

  // Detect whether the selection is backward.
  var detectionRange = document.createRange();
  detectionRange.setStart(anchorNode, anchorOffset);
  detectionRange.setEnd(focusNode, focusOffset);
  var isBackward = detectionRange.collapsed;
  detectionRange.detach();

  return {
    start: isBackward ? end : start,
    end: isBackward ? start : end
  };
}

/**
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setIEOffsets(node, offsets) {
  var range = document.selection.createRange().duplicate();
  var start, end;

  if (typeof offsets.end === 'undefined') {
    start = offsets.start;
    end = start;
  } else if (offsets.start > offsets.end) {
    start = offsets.end;
    end = offsets.start;
  } else {
    start = offsets.start;
    end = offsets.end;
  }

  range.moveToElementText(node);
  range.moveStart('character', start);
  range.setEndPoint('EndToStart', range);
  range.moveEnd('character', end - start);
  range.select();
}

/**
 * In modern non-IE browsers, we can support both forward and backward
 * selections.
 *
 * Note: IE10+ supports the Selection object, but it does not support
 * the `extend` method, which means that even in modern IE, it's not possible
 * to programatically create a backward selection. Thus, for all IE
 * versions, we use the old IE API to create our selections.
 *
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 */
function setModernOffsets(node, offsets) {
  var selection = window.getSelection();

  var length = node[getTextContentAccessor()].length;
  var start = Math.min(offsets.start, length);
  var end = typeof offsets.end === 'undefined' ?
            start : Math.min(offsets.end, length);

  // IE 11 uses modern selection, but doesn't support the extend method.
  // Flip backward selections, so we can set with a single range.
  if (!selection.extend && start > end) {
    var temp = end;
    end = start;
    start = temp;
  }

  var startMarker = getNodeForCharacterOffset(node, start);
  var endMarker = getNodeForCharacterOffset(node, end);

  if (startMarker && endMarker) {
    var range = document.createRange();
    range.setStart(startMarker.node, startMarker.offset);
    selection.removeAllRanges();

    if (start > end) {
      selection.addRange(range);
      selection.extend(endMarker.node, endMarker.offset);
    } else {
      range.setEnd(endMarker.node, endMarker.offset);
      selection.addRange(range);
    }

    range.detach();
  }
}

var ReactDOMSelection = {
  /**
   * @param {DOMElement} node
   */
  getOffsets: function(node) {
    var getOffsets = document.selection ? getIEOffsets : getModernOffsets;
    return getOffsets(node);
  },

  /**
   * @param {DOMElement|DOMTextNode} node
   * @param {object} offsets
   */
  setOffsets: function(node, offsets) {
    var setOffsets = document.selection ? setIEOffsets : setModernOffsets;
    setOffsets(node, offsets);
  }
};

module.exports = ReactDOMSelection;

},{"./getNodeForCharacterOffset":103,"./getTextContentAccessor":105}],42:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMTextarea
 */

"use strict";

var AutoFocusMixin = require("./AutoFocusMixin");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var LinkedValueUtils = require("./LinkedValueUtils");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <textarea> `ReactDOMComponent`.
var textarea = ReactDOM.textarea;

/**
 * Implements a <textarea> native component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMTextarea',

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin],

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    // TODO (yungsters): Remove support for children content in <textarea>.
    var children = this.props.children;
    if (children != null) {
      if ("production" !== "development") {
        console.warn(
          'Use the `defaultValue` or `value` props instead of setting ' +
          'children on <textarea>.'
        );
      }
      ("production" !== "development" ? invariant(
        defaultValue == null,
        'If you supply `defaultValue` on a <textarea>, do not pass children.'
      ) : invariant(defaultValue == null));
      if (Array.isArray(children)) {
        ("production" !== "development" ? invariant(
          children.length <= 1,
          '<textarea> can only have at most one child.'
        ) : invariant(children.length <= 1));
        children = children[0];
      }

      defaultValue = '' + children;
    }
    if (defaultValue == null) {
      defaultValue = '';
    }
    var value = LinkedValueUtils.getValue(this);
    return {
      // We save the initial value so that `ReactDOMComponent` doesn't update
      // `textContent` (unnecessary since we update value).
      // The initial value can be a boolean or object so that's why it's
      // forced to be a string.
      initialValue: '' + (value != null ? value : defaultValue),
      value: defaultValue
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);
    var value = LinkedValueUtils.getValue(this);

    ("production" !== "development" ? invariant(
      props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
    ) : invariant(props.dangerouslySetInnerHTML == null));

    props.defaultValue = null;
    props.value = value != null ? value : this.state.value;
    props.onChange = this._handleChange;

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.
    return textarea(props, this.state.initialValue);
  },

  componentDidUpdate: function(prevProps, prevState, prevContext) {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      var rootNode = this.getDOMNode();
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      this._isChanging = true;
      returnValue = onChange.call(this, event);
      this._isChanging = false;
    }
    this.setState({value: event.target.value});
    return returnValue;
  }

});

module.exports = ReactDOMTextarea;

},{"./AutoFocusMixin":1,"./DOMPropertyOperations":9,"./LinkedValueUtils":21,"./ReactCompositeComponent":29,"./ReactDOM":32,"./invariant":108,"./merge":117}],43:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultBatchingStrategy
 */

"use strict";

var ReactUpdates = require("./ReactUpdates");
var Transaction = require("./Transaction");

var emptyFunction = require("./emptyFunction");
var mixInto = require("./mixInto");

var RESET_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: function() {
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  }
};

var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction();
}

mixInto(ReactDefaultBatchingStrategyTransaction, Transaction.Mixin);
mixInto(ReactDefaultBatchingStrategyTransaction, {
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS;
  }
});

var transaction = new ReactDefaultBatchingStrategyTransaction();

var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   */
  batchedUpdates: function(callback, param) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    // The code is written this way to avoid extra allocations
    if (alreadyBatchingUpdates) {
      callback(param);
    } else {
      transaction.perform(callback, null, param);
    }
  }
};

module.exports = ReactDefaultBatchingStrategy;

},{"./ReactUpdates":70,"./Transaction":84,"./emptyFunction":95,"./mixInto":120}],44:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultInjection
 */

"use strict";

var ReactInjection = require("./ReactInjection");

var ExecutionEnvironment = require("./ExecutionEnvironment");

var DefaultDOMPropertyConfig = require("./DefaultDOMPropertyConfig");

var ChangeEventPlugin = require("./ChangeEventPlugin");
var ClientReactRootIndex = require("./ClientReactRootIndex");
var CompositionEventPlugin = require("./CompositionEventPlugin");
var DefaultEventPluginOrder = require("./DefaultEventPluginOrder");
var EnterLeaveEventPlugin = require("./EnterLeaveEventPlugin");
var MobileSafariClickEventPlugin = require("./MobileSafariClickEventPlugin");
var ReactEventTopLevelCallback = require("./ReactEventTopLevelCallback");
var ReactDOM = require("./ReactDOM");
var ReactDOMButton = require("./ReactDOMButton");
var ReactDOMForm = require("./ReactDOMForm");
var ReactDOMImg = require("./ReactDOMImg");
var ReactDOMInput = require("./ReactDOMInput");
var ReactDOMOption = require("./ReactDOMOption");
var ReactDOMSelect = require("./ReactDOMSelect");
var ReactDOMTextarea = require("./ReactDOMTextarea");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");
var SelectEventPlugin = require("./SelectEventPlugin");
var ServerReactRootIndex = require("./ServerReactRootIndex");
var SimpleEventPlugin = require("./SimpleEventPlugin");

var ReactDefaultBatchingStrategy = require("./ReactDefaultBatchingStrategy");

var createFullPageComponent = require("./createFullPageComponent");

function inject() {
  ReactInjection.EventEmitter.injectTopLevelCallbackCreator(
    ReactEventTopLevelCallback
  );

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);
  ReactInjection.EventPluginHub.injectMount(ReactMount);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    CompositionEventPlugin: CompositionEventPlugin,
    MobileSafariClickEventPlugin: MobileSafariClickEventPlugin,
    SelectEventPlugin: SelectEventPlugin
  });

  ReactInjection.DOM.injectComponentClasses({
    button: ReactDOMButton,
    form: ReactDOMForm,
    img: ReactDOMImg,
    input: ReactDOMInput,
    option: ReactDOMOption,
    select: ReactDOMSelect,
    textarea: ReactDOMTextarea,

    html: createFullPageComponent(ReactDOM.html),
    head: createFullPageComponent(ReactDOM.head),
    title: createFullPageComponent(ReactDOM.title),
    body: createFullPageComponent(ReactDOM.body)
  });

  ReactInjection.DOMProperty.injectDOMPropertyConfig(DefaultDOMPropertyConfig);

  ReactInjection.Updates.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactInjection.RootIndex.injectCreateReactRootIndex(
    ExecutionEnvironment.canUseDOM ?
      ClientReactRootIndex.createReactRootIndex :
      ServerReactRootIndex.createReactRootIndex
  );

  if ("production" !== "development") {
    var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
    if ((/[?&]react_perf\b/).test(url)) {
      var ReactDefaultPerf = require("./ReactDefaultPerf");
      ReactDefaultPerf.start();
    }
  }
}

module.exports = {
  inject: inject
};

},{"./ChangeEventPlugin":4,"./ClientReactRootIndex":5,"./CompositionEventPlugin":6,"./DefaultDOMPropertyConfig":11,"./DefaultEventPluginOrder":12,"./EnterLeaveEventPlugin":13,"./ExecutionEnvironment":20,"./MobileSafariClickEventPlugin":22,"./ReactDOM":32,"./ReactDOMButton":33,"./ReactDOMForm":35,"./ReactDOMImg":37,"./ReactDOMInput":38,"./ReactDOMOption":39,"./ReactDOMSelect":40,"./ReactDOMTextarea":42,"./ReactDefaultBatchingStrategy":43,"./ReactDefaultPerf":45,"./ReactEventTopLevelCallback":50,"./ReactInjection":51,"./ReactInstanceHandles":53,"./ReactMount":55,"./SelectEventPlugin":71,"./ServerReactRootIndex":72,"./SimpleEventPlugin":73,"./createFullPageComponent":91}],45:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultPerf
 * @typechecks static-only
 */

"use strict";

var DOMProperty = require("./DOMProperty");
var ReactDefaultPerfAnalysis = require("./ReactDefaultPerfAnalysis");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");

var performanceNow = require("./performanceNow");

function roundFloat(val) {
  return Math.floor(val * 100) / 100;
}

var ReactDefaultPerf = {
  _allMeasurements: [], // last item in the list is the current one
  _injected: false,

  start: function() {
    if (!ReactDefaultPerf._injected) {
      ReactPerf.injection.injectMeasure(ReactDefaultPerf.measure);
    }

    ReactDefaultPerf._allMeasurements.length = 0;
    ReactPerf.enableMeasure = true;
  },

  stop: function() {
    ReactPerf.enableMeasure = false;
  },

  getLastMeasurements: function() {
    return ReactDefaultPerf._allMeasurements;
  },

  printExclusive: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getExclusiveSummary(measurements);
    console.table(summary.map(function(item) {
      return {
        'Component class name': item.componentName,
        'Total inclusive time (ms)': roundFloat(item.inclusive),
        'Total exclusive time (ms)': roundFloat(item.exclusive),
        'Exclusive time per instance (ms)': roundFloat(item.exclusive / item.count),
        'Instances': item.count
      };
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  printInclusive: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(measurements);
    console.table(summary.map(function(item) {
      return {
        'Owner > component': item.componentName,
        'Inclusive time (ms)': roundFloat(item.time),
        'Instances': item.count
      };
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  printWasted: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(
      measurements,
      true
    );
    console.table(summary.map(function(item) {
      return {
        'Owner > component': item.componentName,
        'Wasted time (ms)': item.time,
        'Instances': item.count
      };
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  printDOM: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
    console.table(summary.map(function(item) {
      var result = {};
      result[DOMProperty.ID_ATTRIBUTE_NAME] = item.id;
      result['type'] = item.type;
      result['args'] = JSON.stringify(item.args);
      return result;
    }));
    console.log(
      'Total time:',
      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
    );
  },

  _recordWrite: function(id, fnName, totalTime, args) {
    // TODO: totalTime isn't that useful since it doesn't count paints/reflows
    var writes =
      ReactDefaultPerf
        ._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1]
        .writes;
    writes[id] = writes[id] || [];
    writes[id].push({
      type: fnName,
      time: totalTime,
      args: args
    });
  },

  measure: function(moduleName, fnName, func) {
    return function() {var args=Array.prototype.slice.call(arguments,0);
      var totalTime;
      var rv;
      var start;

      if (fnName === '_renderNewRootComponent' ||
          fnName === 'flushBatchedUpdates') {
        // A "measurement" is a set of metrics recorded for each flush. We want
        // to group the metrics for a given flush together so we can look at the
        // components that rendered and the DOM operations that actually
        // happened to determine the amount of "wasted work" performed.
        ReactDefaultPerf._allMeasurements.push({
          exclusive: {},
          inclusive: {},
          counts: {},
          writes: {},
          displayNames: {},
          totalTime: 0
        });
        start = performanceNow();
        rv = func.apply(this, args);
        ReactDefaultPerf._allMeasurements[
          ReactDefaultPerf._allMeasurements.length - 1
        ].totalTime = performanceNow() - start;
        return rv;
      } else if (moduleName === 'ReactDOMIDOperations' ||
        moduleName === 'ReactComponentBrowserEnvironment') {
        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        if (fnName === 'mountImageIntoNode') {
          var mountID = ReactMount.getID(args[1]);
          ReactDefaultPerf._recordWrite(mountID, fnName, totalTime, args[0]);
        } else if (fnName === 'dangerouslyProcessChildrenUpdates') {
          // special format
          args[0].forEach(function(update) {
            var writeArgs = {};
            if (update.fromIndex !== null) {
              writeArgs.fromIndex = update.fromIndex;
            }
            if (update.toIndex !== null) {
              writeArgs.toIndex = update.toIndex;
            }
            if (update.textContent !== null) {
              writeArgs.textContent = update.textContent;
            }
            if (update.markupIndex !== null) {
              writeArgs.markup = args[1][update.markupIndex];
            }
            ReactDefaultPerf._recordWrite(
              update.parentID,
              update.type,
              totalTime,
              writeArgs
            );
          });
        } else {
          // basic format
          ReactDefaultPerf._recordWrite(
            args[0],
            fnName,
            totalTime,
            Array.prototype.slice.call(args, 1)
          );
        }
        return rv;
      } else if (moduleName === 'ReactCompositeComponent' && (
        fnName === 'mountComponent' ||
        fnName === 'updateComponent' || // TODO: receiveComponent()?
        fnName === '_renderValidatedComponent')) {

        var rootNodeID = fnName === 'mountComponent' ?
          args[0] :
          this._rootNodeID;
        var isRender = fnName === '_renderValidatedComponent';
        var entry = ReactDefaultPerf._allMeasurements[
          ReactDefaultPerf._allMeasurements.length - 1
        ];

        if (isRender) {
          entry.counts[rootNodeID] = entry.counts[rootNodeID] || 0;
          entry.counts[rootNodeID] += 1;
        }

        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        var typeOfLog = isRender ? entry.exclusive : entry.inclusive;
        typeOfLog[rootNodeID] = typeOfLog[rootNodeID] || 0;
        typeOfLog[rootNodeID] += totalTime;

        entry.displayNames[rootNodeID] = {
          current: this.constructor.displayName,
          owner: this._owner ? this._owner.constructor.displayName : '<root>'
        };

        return rv;
      } else {
        return func.apply(this, args);
      }
    };
  }
};

module.exports = ReactDefaultPerf;

},{"./DOMProperty":8,"./ReactDefaultPerfAnalysis":46,"./ReactMount":55,"./ReactPerf":60,"./performanceNow":124}],46:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultPerfAnalysis
 */

var merge = require("./merge");

// Don't try to save users less than 1.2ms (a number I made up)
var DONT_CARE_THRESHOLD = 1.2;
var DOM_OPERATION_TYPES = {
  'mountImageIntoNode': 'set innerHTML',
  INSERT_MARKUP: 'set innerHTML',
  MOVE_EXISTING: 'move',
  REMOVE_NODE: 'remove',
  TEXT_CONTENT: 'set textContent',
  'updatePropertyByID': 'update attribute',
  'deletePropertyByID': 'delete attribute',
  'updateStylesByID': 'update styles',
  'updateInnerHTMLByID': 'set innerHTML',
  'dangerouslyReplaceNodeWithMarkupByID': 'replace'
};

function getTotalTime(measurements) {
  // TODO: return number of DOM ops? could be misleading.
  // TODO: measure dropped frames after reconcile?
  // TODO: log total time of each reconcile and the top-level component
  // class that triggered it.
  var totalTime = 0;
  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    totalTime += measurement.totalTime;
  }
  return totalTime;
}

function getDOMSummary(measurements) {
  var items = [];
  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var id;

    for (id in measurement.writes) {
      measurement.writes[id].forEach(function(write) {
        items.push({
          id: id,
          type: DOM_OPERATION_TYPES[write.type] || write.type,
          args: write.args
        });
      });
    }
  }
  return items;
}

function getExclusiveSummary(measurements) {
  var candidates = {};
  var displayName;

  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var allIDs = merge(measurement.exclusive, measurement.inclusive);

    for (var id in allIDs) {
      displayName = measurement.displayNames[id].current;

      candidates[displayName] = candidates[displayName] || {
        componentName: displayName,
        inclusive: 0,
        exclusive: 0,
        count: 0
      };
      if (measurement.exclusive[id]) {
        candidates[displayName].exclusive += measurement.exclusive[id];
      }
      if (measurement.inclusive[id]) {
        candidates[displayName].inclusive += measurement.inclusive[id];
      }
      if (measurement.counts[id]) {
        candidates[displayName].count += measurement.counts[id];
      }
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (displayName in candidates) {
    if (candidates[displayName].exclusive >= DONT_CARE_THRESHOLD) {
      arr.push(candidates[displayName]);
    }
  }

  arr.sort(function(a, b) {
    return b.exclusive - a.exclusive;
  });

  return arr;
}

function getInclusiveSummary(measurements, onlyClean) {
  var candidates = {};
  var inclusiveKey;

  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var allIDs = merge(measurement.exclusive, measurement.inclusive);
    var cleanComponents;

    if (onlyClean) {
      cleanComponents = getUnchangedComponents(measurement);
    }

    for (var id in allIDs) {
      if (onlyClean && !cleanComponents[id]) {
        continue;
      }

      var displayName = measurement.displayNames[id];

      // Inclusive time is not useful for many components without knowing where
      // they are instantiated. So we aggregate inclusive time with both the
      // owner and current displayName as the key.
      inclusiveKey = displayName.owner + ' > ' + displayName.current;

      candidates[inclusiveKey] = candidates[inclusiveKey] || {
        componentName: inclusiveKey,
        time: 0,
        count: 0
      };

      if (measurement.inclusive[id]) {
        candidates[inclusiveKey].time += measurement.inclusive[id];
      }
      if (measurement.counts[id]) {
        candidates[inclusiveKey].count += measurement.counts[id];
      }
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (inclusiveKey in candidates) {
    if (candidates[inclusiveKey].time >= DONT_CARE_THRESHOLD) {
      arr.push(candidates[inclusiveKey]);
    }
  }

  arr.sort(function(a, b) {
    return b.time - a.time;
  });

  return arr;
}

function getUnchangedComponents(measurement) {
  // For a given reconcile, look at which components did not actually
  // render anything to the DOM and return a mapping of their ID to
  // the amount of time it took to render the entire subtree.
  var cleanComponents = {};
  var dirtyLeafIDs = Object.keys(measurement.writes);
  var allIDs = merge(measurement.exclusive, measurement.inclusive);

  for (var id in allIDs) {
    var isDirty = false;
    // For each component that rendered, see if a component that triggerd
    // a DOM op is in its subtree.
    for (var i = 0; i < dirtyLeafIDs.length; i++) {
      if (dirtyLeafIDs[i].indexOf(id) === 0) {
        isDirty = true;
        break;
      }
    }
    if (!isDirty && measurement.counts[id] > 0) {
      cleanComponents[id] = true;
    }
  }
  return cleanComponents;
}

var ReactDefaultPerfAnalysis = {
  getExclusiveSummary: getExclusiveSummary,
  getInclusiveSummary: getInclusiveSummary,
  getDOMSummary: getDOMSummary,
  getTotalTime: getTotalTime
};

module.exports = ReactDefaultPerfAnalysis;

},{"./merge":117}],47:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactErrorUtils
 * @typechecks
 */

"use strict";

var ReactErrorUtils = {
  /**
   * Creates a guarded version of a function. This is supposed to make debugging
   * of event handlers easier. To aid debugging with the browser's debugger,
   * this currently simply returns the original function.
   *
   * @param {function} func Function to be executed
   * @param {string} name The name of the guard
   * @return {function}
   */
  guard: function(func, name) {
    return func;
  }
};

module.exports = ReactErrorUtils;

},{}],48:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventEmitter
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventListener = require("./EventListener");
var EventPluginHub = require("./EventPluginHub");
var EventPluginRegistry = require("./EventPluginRegistry");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactEventEmitterMixin = require("./ReactEventEmitterMixin");
var ViewportMetrics = require("./ViewportMetrics");

var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");
var merge = require("./merge");

/**
 * Summary of `ReactEventEmitter` event handling:
 *
 *  - Top-level delegation is used to trap native browser events. We normalize
 *    and de-duplicate events to account for browser quirks.
 *
 *  - Forward these native events (with the associated top-level type used to
 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginHub` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginHub` then dispatches the events.
 *
 * Overview of React and the event system:
 *
 *                   .
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .                         +-----------+
 *       +           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

var alreadyListeningTo = {};
var isMonitoringScrollValue = false;
var reactTopListenersCounter = 0;

// For events like 'submit' which don't consistently bubble (which we trap at a
// lower node than `document`), binding at `document` would cause duplicate
// events so we don't include them here
var topEventMapping = {
  topBlur: 'blur',
  topChange: 'change',
  topClick: 'click',
  topCompositionEnd: 'compositionend',
  topCompositionStart: 'compositionstart',
  topCompositionUpdate: 'compositionupdate',
  topContextMenu: 'contextmenu',
  topCopy: 'copy',
  topCut: 'cut',
  topDoubleClick: 'dblclick',
  topDrag: 'drag',
  topDragEnd: 'dragend',
  topDragEnter: 'dragenter',
  topDragExit: 'dragexit',
  topDragLeave: 'dragleave',
  topDragOver: 'dragover',
  topDragStart: 'dragstart',
  topDrop: 'drop',
  topFocus: 'focus',
  topInput: 'input',
  topKeyDown: 'keydown',
  topKeyPress: 'keypress',
  topKeyUp: 'keyup',
  topMouseDown: 'mousedown',
  topMouseMove: 'mousemove',
  topMouseOut: 'mouseout',
  topMouseOver: 'mouseover',
  topMouseUp: 'mouseup',
  topPaste: 'paste',
  topScroll: 'scroll',
  topSelectionChange: 'selectionchange',
  topTouchCancel: 'touchcancel',
  topTouchEnd: 'touchend',
  topTouchMove: 'touchmove',
  topTouchStart: 'touchstart',
  topWheel: 'wheel'
};

/**
 * To ensure no conflicts with other potential React instances on the page
 */
var topListenersIDKey = "_reactListenersID" + String(Math.random()).slice(2);

function getListeningForDocument(mountAt) {
  if (mountAt[topListenersIDKey] == null) {
    mountAt[topListenersIDKey] = reactTopListenersCounter++;
    alreadyListeningTo[mountAt[topListenersIDKey]] = {};
  }
  return alreadyListeningTo[mountAt[topListenersIDKey]];
}

/**
 * Traps top-level events by using event bubbling.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapBubbledEvent(topLevelType, handlerBaseName, element) {
  EventListener.listen(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * Traps a top-level event by using event capturing.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapCapturedEvent(topLevelType, handlerBaseName, element) {
  EventListener.capture(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * `ReactEventEmitter` is used to attach top-level event listeners. For example:
 *
 *   ReactEventEmitter.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 *
 * @internal
 */
var ReactEventEmitter = merge(ReactEventEmitterMixin, {

  /**
   * React references `ReactEventTopLevelCallback` using this property in order
   * to allow dependency injection.
   */
  TopLevelCallbackCreator: null,

  injection: {
    /**
     * @param {function} TopLevelCallbackCreator
     */
    injectTopLevelCallbackCreator: function(TopLevelCallbackCreator) {
      ReactEventEmitter.TopLevelCallbackCreator = TopLevelCallbackCreator;
    }
  },

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    ("production" !== "development" ? invariant(
      ExecutionEnvironment.canUseDOM,
      'setEnabled(...): Cannot toggle event listening in a Worker thread. ' +
      'This is likely a bug in the framework. Please report immediately.'
    ) : invariant(ExecutionEnvironment.canUseDOM));
    if (ReactEventEmitter.TopLevelCallbackCreator) {
      ReactEventEmitter.TopLevelCallbackCreator.setEnabled(enabled);
    }
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return !!(
      ReactEventEmitter.TopLevelCallbackCreator &&
      ReactEventEmitter.TopLevelCallbackCreator.isEnabled()
    );
  },

  /**
   * We listen for bubbled touch events on the document object.
   *
   * Firefox v8.01 (and possibly others) exhibited strange behavior when
   * mounting `onmousemove` events at some node that was not the document
   * element. The symptoms were that if your mouse is not moving over something
   * contained within that mount point (for example on the background) the
   * top-level listeners for `onmousemove` won't be called. However, if you
   * register the `mousemove` on the document object, then it will of course
   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
   * top-level listeners to the document object only, at least for these
   * movement types of events and possibly all events.
   *
   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
   *
   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
   * they bubble to document.
   *
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {DOMDocument} contentDocument Document which owns the container
   */
  listenTo: function(registrationName, contentDocument) {
    var mountAt = contentDocument;
    var isListening = getListeningForDocument(mountAt);
    var dependencies = EventPluginRegistry.
      registrationNameDependencies[registrationName];

    var topLevelTypes = EventConstants.topLevelTypes;
    for (var i = 0, l = dependencies.length; i < l; i++) {
      var dependency = dependencies[i];
      if (!isListening[dependency]) {
        var topLevelType = topLevelTypes[dependency];

        if (topLevelType === topLevelTypes.topWheel) {
          if (isEventSupported('wheel')) {
            trapBubbledEvent(topLevelTypes.topWheel, 'wheel', mountAt);
          } else if (isEventSupported('mousewheel')) {
            trapBubbledEvent(topLevelTypes.topWheel, 'mousewheel', mountAt);
          } else {
            // Firefox needs to capture a different mouse scroll event.
            // @see http://www.quirksmode.org/dom/events/tests/scroll.html
            trapBubbledEvent(
              topLevelTypes.topWheel,
              'DOMMouseScroll',
              mountAt);
          }
        } else if (topLevelType === topLevelTypes.topScroll) {

          if (isEventSupported('scroll', true)) {
            trapCapturedEvent(topLevelTypes.topScroll, 'scroll', mountAt);
          } else {
            trapBubbledEvent(topLevelTypes.topScroll, 'scroll', window);
          }
        } else if (topLevelType === topLevelTypes.topFocus ||
            topLevelType === topLevelTypes.topBlur) {

          if (isEventSupported('focus', true)) {
            trapCapturedEvent(topLevelTypes.topFocus, 'focus', mountAt);
            trapCapturedEvent(topLevelTypes.topBlur, 'blur', mountAt);
          } else if (isEventSupported('focusin')) {
            // IE has `focusin` and `focusout` events which bubble.
            // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
            trapBubbledEvent(topLevelTypes.topFocus, 'focusin', mountAt);
            trapBubbledEvent(topLevelTypes.topBlur, 'focusout', mountAt);
          }

          // to make sure blur and focus event listeners are only attached once
          isListening[topLevelTypes.topBlur] = true;
          isListening[topLevelTypes.topFocus] = true;
        } else if (topEventMapping[dependency]) {
          trapBubbledEvent(topLevelType, topEventMapping[dependency], mountAt);
        }

        isListening[dependency] = true;
      }
    }
  },

  /**
   * Listens to window scroll and resize events. We cache scroll values so that
   * application code can access them without triggering reflows.
   *
   * NOTE: Scroll events do not bubble.
   *
   * @see http://www.quirksmode.org/dom/events/scroll.html
   */
  ensureScrollValueMonitoring: function(){
    if (!isMonitoringScrollValue) {
      var refresh = ViewportMetrics.refreshScrollValues;
      EventListener.listen(window, 'scroll', refresh);
      EventListener.listen(window, 'resize', refresh);
      isMonitoringScrollValue = true;
    }
  },

  eventNameDispatchConfigs: EventPluginHub.eventNameDispatchConfigs,

  registrationNameModules: EventPluginHub.registrationNameModules,

  putListener: EventPluginHub.putListener,

  getListener: EventPluginHub.getListener,

  deleteListener: EventPluginHub.deleteListener,

  deleteAllListeners: EventPluginHub.deleteAllListeners,

  trapBubbledEvent: trapBubbledEvent,

  trapCapturedEvent: trapCapturedEvent

});

module.exports = ReactEventEmitter;

},{"./EventConstants":14,"./EventListener":15,"./EventPluginHub":16,"./EventPluginRegistry":17,"./ExecutionEnvironment":20,"./ReactEventEmitterMixin":49,"./ViewportMetrics":85,"./invariant":108,"./isEventSupported":109,"./merge":117}],49:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventEmitterMixin
 */

"use strict";

var EventPluginHub = require("./EventPluginHub");
var ReactUpdates = require("./ReactUpdates");

function runEventQueueInBatch(events) {
  EventPluginHub.enqueueEvents(events);
  EventPluginHub.processEventQueue();
}

var ReactEventEmitterMixin = {

  /**
   * Streams a fired top-level event to `EventPluginHub` where plugins have the
   * opportunity to create `ReactEvent`s to be dispatched.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {object} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native environment event.
   */
  handleTopLevel: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events = EventPluginHub.extractEvents(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );

    // Event queue being processed in the same cycle allows `preventDefault`.
    ReactUpdates.batchedUpdates(runEventQueueInBatch, events);
  }
};

module.exports = ReactEventEmitterMixin;

},{"./EventPluginHub":16,"./ReactUpdates":70}],50:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventTopLevelCallback
 * @typechecks static-only
 */

"use strict";

var PooledClass = require("./PooledClass");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMount = require("./ReactMount");

var getEventTarget = require("./getEventTarget");
var mixInto = require("./mixInto");

/**
 * @type {boolean}
 * @private
 */
var _topLevelListenersEnabled = true;

/**
 * Finds the parent React component of `node`.
 *
 * @param {*} node
 * @return {?DOMEventTarget} Parent container, or `null` if the specified node
 *                           is not nested.
 */
function findParent(node) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  var nodeID = ReactMount.getID(node);
  var rootID = ReactInstanceHandles.getReactRootIDFromNodeID(nodeID);
  var container = ReactMount.findReactContainerForID(rootID);
  var parent = ReactMount.getFirstReactDOM(container);
  return parent;
}

/**
 * Calls ReactEventEmitter.handleTopLevel for each node stored in bookKeeping's
 * ancestor list. Separated from createTopLevelCallback to avoid try/finally
 * deoptimization.
 *
 * @param {string} topLevelType
 * @param {DOMEvent} nativeEvent
 * @param {TopLevelCallbackBookKeeping} bookKeeping
 */
function handleTopLevelImpl(topLevelType, nativeEvent, bookKeeping) {
  var topLevelTarget = ReactMount.getFirstReactDOM(
    getEventTarget(nativeEvent)
  ) || window;

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  var ancestor = topLevelTarget;
  while (ancestor) {
    bookKeeping.ancestors.push(ancestor);
    ancestor = findParent(ancestor);
  }

  for (var i = 0, l = bookKeeping.ancestors.length; i < l; i++) {
    topLevelTarget = bookKeeping.ancestors[i];
    var topLevelTargetID = ReactMount.getID(topLevelTarget) || '';
    ReactEventEmitter.handleTopLevel(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );
  }
}

// Used to store ancestor hierarchy in top level callback
function TopLevelCallbackBookKeeping() {
  this.ancestors = [];
}
mixInto(TopLevelCallbackBookKeeping, {
  destructor: function() {
    this.ancestors.length = 0;
  }
});
PooledClass.addPoolingTo(TopLevelCallbackBookKeeping);

/**
 * Top-level callback creator used to implement event handling using delegation.
 * This is used via dependency injection.
 */
var ReactEventTopLevelCallback = {

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    _topLevelListenersEnabled = !!enabled;
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return _topLevelListenersEnabled;
  },

  /**
   * Creates a callback for the supplied `topLevelType` that could be added as
   * a listener to the document. The callback computes a `topLevelTarget` which
   * should be the root node of a mounted React component where the listener
   * is attached.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @return {function} Callback for handling top-level events.
   */
  createTopLevelCallback: function(topLevelType) {
    return function(nativeEvent) {
      if (!_topLevelListenersEnabled) {
        return;
      }

      var bookKeeping = TopLevelCallbackBookKeeping.getPooled();
      try {
        handleTopLevelImpl(topLevelType, nativeEvent, bookKeeping);
      } finally {
        TopLevelCallbackBookKeeping.release(bookKeeping);
      }
    };
  }

};

module.exports = ReactEventTopLevelCallback;

},{"./PooledClass":23,"./ReactEventEmitter":48,"./ReactInstanceHandles":53,"./ReactMount":55,"./getEventTarget":101,"./mixInto":120}],51:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInjection
 */

"use strict";

var DOMProperty = require("./DOMProperty");
var EventPluginHub = require("./EventPluginHub");
var ReactDOM = require("./ReactDOM");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactPerf = require("./ReactPerf");
var ReactRootIndex = require("./ReactRootIndex");
var ReactUpdates = require("./ReactUpdates");

var ReactInjection = {
  DOMProperty: DOMProperty.injection,
  EventPluginHub: EventPluginHub.injection,
  DOM: ReactDOM.injection,
  EventEmitter: ReactEventEmitter.injection,
  Perf: ReactPerf.injection,
  RootIndex: ReactRootIndex.injection,
  Updates: ReactUpdates.injection
};

module.exports = ReactInjection;

},{"./DOMProperty":8,"./EventPluginHub":16,"./ReactDOM":32,"./ReactEventEmitter":48,"./ReactPerf":60,"./ReactRootIndex":67,"./ReactUpdates":70}],52:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInputSelection
 */

"use strict";

var ReactDOMSelection = require("./ReactDOMSelection");

var containsNode = require("./containsNode");
var getActiveElement = require("./getActiveElement");

function isInDocument(node) {
  return containsNode(document.documentElement, node);
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {

  hasSelectionCapabilities: function(elem) {
    return elem && (
      (elem.nodeName === 'INPUT' && elem.type === 'text') ||
      elem.nodeName === 'TEXTAREA' ||
      elem.contentEditable === 'true'
    );
  },

  getSelectionInformation: function() {
    var focusedElem = getActiveElement();
    return {
      focusedElem: focusedElem,
      selectionRange:
          ReactInputSelection.hasSelectionCapabilities(focusedElem) ?
          ReactInputSelection.getSelection(focusedElem) :
          null
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function(priorSelectionInformation) {
    var curFocusedElem = getActiveElement();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem &&
        isInDocument(priorFocusedElem)) {
      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
        ReactInputSelection.setSelection(
          priorFocusedElem,
          priorSelectionRange
        );
      }
      priorFocusedElem.focus();
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a focused textarea, input or
   * contentEditable node.
   * -@input: Look up selection bounds of this input
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function(input) {
    var selection;

    if ('selectionStart' in input) {
      // Modern browser with input or textarea.
      selection = {
        start: input.selectionStart,
        end: input.selectionEnd
      };
    } else if (document.selection && input.nodeName === 'INPUT') {
      // IE8 input.
      var range = document.selection.createRange();
      // There can only be one selection per document in IE, so it must
      // be in our element.
      if (range.parentElement() === input) {
        selection = {
          start: -range.moveStart('character', -input.value.length),
          end: -range.moveEnd('character', -input.value.length)
        };
      }
    } else {
      // Content editable or old IE textarea.
      selection = ReactDOMSelection.getOffsets(input);
    }

    return selection || {start: 0, end: 0};
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@offsets   Object of same form that is returned from get*
   */
  setSelection: function(input, offsets) {
    var start = offsets.start;
    var end = offsets.end;
    if (typeof end === 'undefined') {
      end = start;
    }

    if ('selectionStart' in input) {
      input.selectionStart = start;
      input.selectionEnd = Math.min(end, input.value.length);
    } else if (document.selection && input.nodeName === 'INPUT') {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', start);
      range.moveEnd('character', end - start);
      range.select();
    } else {
      ReactDOMSelection.setOffsets(input, offsets);
    }
  }
};

module.exports = ReactInputSelection;

},{"./ReactDOMSelection":41,"./containsNode":88,"./getActiveElement":99}],53:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInstanceHandles
 * @typechecks static-only
 */

"use strict";

var ReactRootIndex = require("./ReactRootIndex");

var invariant = require("./invariant");

var SEPARATOR = '.';
var SEPARATOR_LENGTH = SEPARATOR.length;

/**
 * Maximum depth of traversals before we consider the possibility of a bad ID.
 */
var MAX_TREE_DEPTH = 100;

/**
 * Creates a DOM ID prefix to use when mounting React components.
 *
 * @param {number} index A unique integer
 * @return {string} React root ID.
 * @internal
 */
function getReactRootIDString(index) {
  return SEPARATOR + index.toString(36);
}

/**
 * Checks if a character in the supplied ID is a separator or the end.
 *
 * @param {string} id A React DOM ID.
 * @param {number} index Index of the character to check.
 * @return {boolean} True if the character is a separator or end of the ID.
 * @private
 */
function isBoundary(id, index) {
  return id.charAt(index) === SEPARATOR || index === id.length;
}

/**
 * Checks if the supplied string is a valid React DOM ID.
 *
 * @param {string} id A React DOM ID, maybe.
 * @return {boolean} True if the string is a valid React DOM ID.
 * @private
 */
function isValidID(id) {
  return id === '' || (
    id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR
  );
}

/**
 * Checks if the first ID is an ancestor of or equal to the second ID.
 *
 * @param {string} ancestorID
 * @param {string} descendantID
 * @return {boolean} True if `ancestorID` is an ancestor of `descendantID`.
 * @internal
 */
function isAncestorIDOf(ancestorID, descendantID) {
  return (
    descendantID.indexOf(ancestorID) === 0 &&
    isBoundary(descendantID, ancestorID.length)
  );
}

/**
 * Gets the parent ID of the supplied React DOM ID, `id`.
 *
 * @param {string} id ID of a component.
 * @return {string} ID of the parent, or an empty string.
 * @private
 */
function getParentID(id) {
  return id ? id.substr(0, id.lastIndexOf(SEPARATOR)) : '';
}

/**
 * Gets the next DOM ID on the tree path from the supplied `ancestorID` to the
 * supplied `destinationID`. If they are equal, the ID is returned.
 *
 * @param {string} ancestorID ID of an ancestor node of `destinationID`.
 * @param {string} destinationID ID of the destination node.
 * @return {string} Next ID on the path from `ancestorID` to `destinationID`.
 * @private
 */
function getNextDescendantID(ancestorID, destinationID) {
  ("production" !== "development" ? invariant(
    isValidID(ancestorID) && isValidID(destinationID),
    'getNextDescendantID(%s, %s): Received an invalid React DOM ID.',
    ancestorID,
    destinationID
  ) : invariant(isValidID(ancestorID) && isValidID(destinationID)));
  ("production" !== "development" ? invariant(
    isAncestorIDOf(ancestorID, destinationID),
    'getNextDescendantID(...): React has made an invalid assumption about ' +
    'the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.',
    ancestorID,
    destinationID
  ) : invariant(isAncestorIDOf(ancestorID, destinationID)));
  if (ancestorID === destinationID) {
    return ancestorID;
  }
  // Skip over the ancestor and the immediate separator. Traverse until we hit
  // another separator or we reach the end of `destinationID`.
  var start = ancestorID.length + SEPARATOR_LENGTH;
  for (var i = start; i < destinationID.length; i++) {
    if (isBoundary(destinationID, i)) {
      break;
    }
  }
  return destinationID.substr(0, i);
}

/**
 * Gets the nearest common ancestor ID of two IDs.
 *
 * Using this ID scheme, the nearest common ancestor ID is the longest common
 * prefix of the two IDs that immediately preceded a "marker" in both strings.
 *
 * @param {string} oneID
 * @param {string} twoID
 * @return {string} Nearest common ancestor ID, or the empty string if none.
 * @private
 */
function getFirstCommonAncestorID(oneID, twoID) {
  var minLength = Math.min(oneID.length, twoID.length);
  if (minLength === 0) {
    return '';
  }
  var lastCommonMarkerIndex = 0;
  // Use `<=` to traverse until the "EOL" of the shorter string.
  for (var i = 0; i <= minLength; i++) {
    if (isBoundary(oneID, i) && isBoundary(twoID, i)) {
      lastCommonMarkerIndex = i;
    } else if (oneID.charAt(i) !== twoID.charAt(i)) {
      break;
    }
  }
  var longestCommonID = oneID.substr(0, lastCommonMarkerIndex);
  ("production" !== "development" ? invariant(
    isValidID(longestCommonID),
    'getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s',
    oneID,
    twoID,
    longestCommonID
  ) : invariant(isValidID(longestCommonID)));
  return longestCommonID;
}

/**
 * Traverses the parent path between two IDs (either up or down). The IDs must
 * not be the same, and there must exist a parent path between them. If the
 * callback returns `false`, traversal is stopped.
 *
 * @param {?string} start ID at which to start traversal.
 * @param {?string} stop ID at which to end traversal.
 * @param {function} cb Callback to invoke each ID with.
 * @param {?boolean} skipFirst Whether or not to skip the first node.
 * @param {?boolean} skipLast Whether or not to skip the last node.
 * @private
 */
function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast) {
  start = start || '';
  stop = stop || '';
  ("production" !== "development" ? invariant(
    start !== stop,
    'traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.',
    start
  ) : invariant(start !== stop));
  var traverseUp = isAncestorIDOf(stop, start);
  ("production" !== "development" ? invariant(
    traverseUp || isAncestorIDOf(start, stop),
    'traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do ' +
    'not have a parent path.',
    start,
    stop
  ) : invariant(traverseUp || isAncestorIDOf(start, stop)));
  // Traverse from `start` to `stop` one depth at a time.
  var depth = 0;
  var traverse = traverseUp ? getParentID : getNextDescendantID;
  for (var id = start; /* until break */; id = traverse(id, stop)) {
    var ret;
    if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
      ret = cb(id, traverseUp, arg);
    }
    if (ret === false || id === stop) {
      // Only break //after// visiting `stop`.
      break;
    }
    ("production" !== "development" ? invariant(
      depth++ < MAX_TREE_DEPTH,
      'traverseParentPath(%s, %s, ...): Detected an infinite loop while ' +
      'traversing the React DOM ID tree. This may be due to malformed IDs: %s',
      start, stop
    ) : invariant(depth++ < MAX_TREE_DEPTH));
  }
}

/**
 * Manages the IDs assigned to DOM representations of React components. This
 * uses a specific scheme in order to traverse the DOM efficiently (e.g. in
 * order to simulate events).
 *
 * @internal
 */
var ReactInstanceHandles = {

  /**
   * Constructs a React root ID
   * @return {string} A React root ID.
   */
  createReactRootID: function() {
    return getReactRootIDString(ReactRootIndex.createReactRootIndex());
  },

  /**
   * Constructs a React ID by joining a root ID with a name.
   *
   * @param {string} rootID Root ID of a parent component.
   * @param {string} name A component's name (as flattened children).
   * @return {string} A React ID.
   * @internal
   */
  createReactID: function(rootID, name) {
    return rootID + name;
  },

  /**
   * Gets the DOM ID of the React component that is the root of the tree that
   * contains the React component with the supplied DOM ID.
   *
   * @param {string} id DOM ID of a React component.
   * @return {?string} DOM ID of the React component that is the root.
   * @internal
   */
  getReactRootIDFromNodeID: function(id) {
    if (id && id.charAt(0) === SEPARATOR && id.length > 1) {
      var index = id.indexOf(SEPARATOR, 1);
      return index > -1 ? id.substr(0, index) : id;
    }
    return null;
  },

  /**
   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
   * should would receive a `mouseEnter` or `mouseLeave` event.
   *
   * NOTE: Does not invoke the callback on the nearest common ancestor because
   * nothing "entered" or "left" that element.
   *
   * @param {string} leaveID ID being left.
   * @param {string} enterID ID being entered.
   * @param {function} cb Callback to invoke on each entered/left ID.
   * @param {*} upArg Argument to invoke the callback with on left IDs.
   * @param {*} downArg Argument to invoke the callback with on entered IDs.
   * @internal
   */
  traverseEnterLeave: function(leaveID, enterID, cb, upArg, downArg) {
    var ancestorID = getFirstCommonAncestorID(leaveID, enterID);
    if (ancestorID !== leaveID) {
      traverseParentPath(leaveID, ancestorID, cb, upArg, false, true);
    }
    if (ancestorID !== enterID) {
      traverseParentPath(ancestorID, enterID, cb, downArg, true, false);
    }
  },

  /**
   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseTwoPhase: function(targetID, cb, arg) {
    if (targetID) {
      traverseParentPath('', targetID, cb, arg, true, false);
      traverseParentPath(targetID, '', cb, arg, false, true);
    }
  },

  /**
   * Traverse a node ID, calling the supplied `cb` for each ancestor ID. For
   * example, passing `.0.$row-0.1` would result in `cb` getting called
   * with `.0`, `.0.$row-0`, and `.0.$row-0.1`.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseAncestors: function(targetID, cb, arg) {
    traverseParentPath('', targetID, cb, arg, true, false);
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _getFirstCommonAncestorID: getFirstCommonAncestorID,

  /**
   * Exposed for unit testing.
   * @private
   */
  _getNextDescendantID: getNextDescendantID,

  isAncestorIDOf: isAncestorIDOf,

  SEPARATOR: SEPARATOR

};

module.exports = ReactInstanceHandles;

},{"./ReactRootIndex":67,"./invariant":108}],54:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMarkupChecksum
 */

"use strict";

var adler32 = require("./adler32");

var ReactMarkupChecksum = {
  CHECKSUM_ATTR_NAME: 'data-react-checksum',

  /**
   * @param {string} markup Markup string
   * @return {string} Markup string with checksum attribute attached
   */
  addChecksumToMarkup: function(markup) {
    var checksum = adler32(markup);
    return markup.replace(
      '>',
      ' ' + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="' + checksum + '">'
    );
  },

  /**
   * @param {string} markup to use
   * @param {DOMElement} element root React element
   * @returns {boolean} whether or not the markup is the same
   */
  canReuseMarkup: function(markup, element) {
    var existingChecksum = element.getAttribute(
      ReactMarkupChecksum.CHECKSUM_ATTR_NAME
    );
    existingChecksum = existingChecksum && parseInt(existingChecksum, 10);
    var markupChecksum = adler32(markup);
    return markupChecksum === existingChecksum;
  }
};

module.exports = ReactMarkupChecksum;

},{"./adler32":87}],55:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMount
 */

"use strict";

var DOMProperty = require("./DOMProperty");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactPerf = require("./ReactPerf");

var containsNode = require("./containsNode");
var getReactRootElementInContainer = require("./getReactRootElementInContainer");
var invariant = require("./invariant");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");

var SEPARATOR = ReactInstanceHandles.SEPARATOR;

var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
var nodeCache = {};

var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;

/** Mapping from reactRootID to React component instance. */
var instancesByReactRootID = {};

/** Mapping from reactRootID to `container` nodes. */
var containersByReactRootID = {};

if ("production" !== "development") {
  /** __DEV__-only mapping from reactRootID to root elements. */
  var rootElementsByReactRootID = {};
}

// Used to store breadth-first search state in findComponentRoot.
var findComponentRootReusableArray = [];

/**
 * @param {DOMElement} container DOM element that may contain a React component.
 * @return {?string} A "reactRoot" ID, if a React component is rendered.
 */
function getReactRootID(container) {
  var rootElement = getReactRootElementInContainer(container);
  return rootElement && ReactMount.getID(rootElement);
}

/**
 * Accessing node[ATTR_NAME] or calling getAttribute(ATTR_NAME) on a form
 * element can return its control whose name or ID equals ATTR_NAME. All
 * DOM nodes support `getAttributeNode` but this can also get called on
 * other objects so just return '' if we're given something other than a
 * DOM node (such as window).
 *
 * @param {?DOMElement|DOMWindow|DOMDocument|DOMTextNode} node DOM node.
 * @return {string} ID of the supplied `domNode`.
 */
function getID(node) {
  var id = internalGetID(node);
  if (id) {
    if (nodeCache.hasOwnProperty(id)) {
      var cached = nodeCache[id];
      if (cached !== node) {
        ("production" !== "development" ? invariant(
          !isValid(cached, id),
          'ReactMount: Two valid but unequal nodes with the same `%s`: %s',
          ATTR_NAME, id
        ) : invariant(!isValid(cached, id)));

        nodeCache[id] = node;
      }
    } else {
      nodeCache[id] = node;
    }
  }

  return id;
}

function internalGetID(node) {
  // If node is something like a window, document, or text node, none of
  // which support attributes or a .getAttribute method, gracefully return
  // the empty string, as if the attribute were missing.
  return node && node.getAttribute && node.getAttribute(ATTR_NAME) || '';
}

/**
 * Sets the React-specific ID of the given node.
 *
 * @param {DOMElement} node The DOM node whose ID will be set.
 * @param {string} id The value of the ID attribute.
 */
function setID(node, id) {
  var oldID = internalGetID(node);
  if (oldID !== id) {
    delete nodeCache[oldID];
  }
  node.setAttribute(ATTR_NAME, id);
  nodeCache[id] = node;
}

/**
 * Finds the node with the supplied React-generated DOM ID.
 *
 * @param {string} id A React-generated DOM ID.
 * @return {DOMElement} DOM node with the suppled `id`.
 * @internal
 */
function getNode(id) {
  if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
    nodeCache[id] = ReactMount.findReactNodeByID(id);
  }
  return nodeCache[id];
}

/**
 * A node is "valid" if it is contained by a currently mounted container.
 *
 * This means that the node does not have to be contained by a document in
 * order to be considered valid.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @param {string} id The expected ID of the node.
 * @return {boolean} Whether the node is contained by a mounted container.
 */
function isValid(node, id) {
  if (node) {
    ("production" !== "development" ? invariant(
      internalGetID(node) === id,
      'ReactMount: Unexpected modification of `%s`',
      ATTR_NAME
    ) : invariant(internalGetID(node) === id));

    var container = ReactMount.findReactContainerForID(id);
    if (container && containsNode(container, node)) {
      return true;
    }
  }

  return false;
}

/**
 * Causes the cache to forget about one React-specific ID.
 *
 * @param {string} id The ID to forget.
 */
function purgeID(id) {
  delete nodeCache[id];
}

var deepestNodeSoFar = null;
function findDeepestCachedAncestorImpl(ancestorID) {
  var ancestor = nodeCache[ancestorID];
  if (ancestor && isValid(ancestor, ancestorID)) {
    deepestNodeSoFar = ancestor;
  } else {
    // This node isn't populated in the cache, so presumably none of its
    // descendants are. Break out of the loop.
    return false;
  }
}

/**
 * Return the deepest cached node whose ID is a prefix of `targetID`.
 */
function findDeepestCachedAncestor(targetID) {
  deepestNodeSoFar = null;
  ReactInstanceHandles.traverseAncestors(
    targetID,
    findDeepestCachedAncestorImpl
  );

  var foundNode = deepestNodeSoFar;
  deepestNodeSoFar = null;
  return foundNode;
}

/**
 * Mounting is the process of initializing a React component by creatings its
 * representative DOM elements and inserting them into a supplied `container`.
 * Any prior content inside `container` is destroyed in the process.
 *
 *   ReactMount.renderComponent(
 *     component,
 *     document.getElementById('container')
 *   );
 *
 *   <div id="container">                   <-- Supplied `container`.
 *     <div data-reactid=".3">              <-- Rendered reactRoot of React
 *       // ...                                 component.
 *     </div>
 *   </div>
 *
 * Inside of `container`, the first element rendered is the "reactRoot".
 */
var ReactMount = {
  /** Time spent generating markup. */
  totalInstantiationTime: 0,

  /** Time spent inserting markup into the DOM. */
  totalInjectionTime: 0,

  /** Whether support for touch events should be initialized. */
  useTouchEvents: false,

  /** Exposed for debugging purposes **/
  _instancesByReactRootID: instancesByReactRootID,

  /**
   * This is a hook provided to support rendering React components while
   * ensuring that the apparent scroll position of its `container` does not
   * change.
   *
   * @param {DOMElement} container The `container` being rendered into.
   * @param {function} renderCallback This must be called once to do the render.
   */
  scrollMonitor: function(container, renderCallback) {
    renderCallback();
  },

  /**
   * Take a component that's already mounted into the DOM and replace its props
   * @param {ReactComponent} prevComponent component instance already in the DOM
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {?function} callback function triggered on completion
   */
  _updateRootComponent: function(
      prevComponent,
      nextComponent,
      container,
      callback) {
    var nextProps = nextComponent.props;
    ReactMount.scrollMonitor(container, function() {
      prevComponent.replaceProps(nextProps, callback);
    });

    if ("production" !== "development") {
      // Record the root element in case it later gets transplanted.
      rootElementsByReactRootID[getReactRootID(container)] =
        getReactRootElementInContainer(container);
    }

    return prevComponent;
  },

  /**
   * Register a component into the instance map and starts scroll value
   * monitoring
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @return {string} reactRoot ID prefix
   */
  _registerComponent: function(nextComponent, container) {
    ("production" !== "development" ? invariant(
      container && (
        container.nodeType === ELEMENT_NODE_TYPE ||
        container.nodeType === DOC_NODE_TYPE
      ),
      '_registerComponent(...): Target container is not a DOM element.'
    ) : invariant(container && (
      container.nodeType === ELEMENT_NODE_TYPE ||
      container.nodeType === DOC_NODE_TYPE
    )));

    ReactEventEmitter.ensureScrollValueMonitoring();

    var reactRootID = ReactMount.registerContainer(container);
    instancesByReactRootID[reactRootID] = nextComponent;
    return reactRootID;
  },

  /**
   * Render a new component into the DOM.
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
   * @return {ReactComponent} nextComponent
   */
  _renderNewRootComponent: ReactPerf.measure(
    'ReactMount',
    '_renderNewRootComponent',
    function(
        nextComponent,
        container,
        shouldReuseMarkup) {
      var reactRootID = ReactMount._registerComponent(nextComponent, container);
      nextComponent.mountComponentIntoNode(
        reactRootID,
        container,
        shouldReuseMarkup
      );

      if ("production" !== "development") {
        // Record the root element in case it later gets transplanted.
        rootElementsByReactRootID[reactRootID] =
          getReactRootElementInContainer(container);
      }

      return nextComponent;
    }
  ),

  /**
   * Renders a React component into the DOM in the supplied `container`.
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactComponent} nextComponent Component instance to render.
   * @param {DOMElement} container DOM element to render into.
   * @param {?function} callback function triggered on completion
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  renderComponent: function(nextComponent, container, callback) {
    var prevComponent = instancesByReactRootID[getReactRootID(container)];

    if (prevComponent) {
      if (shouldUpdateReactComponent(prevComponent, nextComponent)) {
        return ReactMount._updateRootComponent(
          prevComponent,
          nextComponent,
          container,
          callback
        );
      } else {
        ReactMount.unmountComponentAtNode(container);
      }
    }

    var reactRootElement = getReactRootElementInContainer(container);
    var containerHasReactMarkup =
      reactRootElement && ReactMount.isRenderedByReact(reactRootElement);

    var shouldReuseMarkup = containerHasReactMarkup && !prevComponent;

    var component = ReactMount._renderNewRootComponent(
      nextComponent,
      container,
      shouldReuseMarkup
    );
    callback && callback.call(component);
    return component;
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into the supplied `container`.
   *
   * @param {function} constructor React component constructor.
   * @param {?object} props Initial props of the component instance.
   * @param {DOMElement} container DOM element to render into.
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  constructAndRenderComponent: function(constructor, props, container) {
    return ReactMount.renderComponent(constructor(props), container);
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into a container node identified by supplied `id`.
   *
   * @param {function} componentConstructor React component constructor
   * @param {?object} props Initial props of the component instance.
   * @param {string} id ID of the DOM element to render into.
   * @return {ReactComponent} Component instance rendered in the container node.
   */
  constructAndRenderComponentByID: function(constructor, props, id) {
    var domNode = document.getElementById(id);
    ("production" !== "development" ? invariant(
      domNode,
      'Tried to get element with id of "%s" but it is not present on the page.',
      id
    ) : invariant(domNode));
    return ReactMount.constructAndRenderComponent(constructor, props, domNode);
  },

  /**
   * Registers a container node into which React components will be rendered.
   * This also creates the "reactRoot" ID that will be assigned to the element
   * rendered within.
   *
   * @param {DOMElement} container DOM element to register as a container.
   * @return {string} The "reactRoot" ID of elements rendered within.
   */
  registerContainer: function(container) {
    var reactRootID = getReactRootID(container);
    if (reactRootID) {
      // If one exists, make sure it is a valid "reactRoot" ID.
      reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
    }
    if (!reactRootID) {
      // No valid "reactRoot" ID found, create one.
      reactRootID = ReactInstanceHandles.createReactRootID();
    }
    containersByReactRootID[reactRootID] = container;
    return reactRootID;
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   *
   * @param {DOMElement} container DOM element containing a React component.
   * @return {boolean} True if a component was found in and unmounted from
   *                   `container`
   */
  unmountComponentAtNode: function(container) {
    var reactRootID = getReactRootID(container);
    var component = instancesByReactRootID[reactRootID];
    if (!component) {
      return false;
    }
    ReactMount.unmountComponentFromNode(component, container);
    delete instancesByReactRootID[reactRootID];
    delete containersByReactRootID[reactRootID];
    if ("production" !== "development") {
      delete rootElementsByReactRootID[reactRootID];
    }
    return true;
  },

  /**
   * Unmounts a component and removes it from the DOM.
   *
   * @param {ReactComponent} instance React component instance.
   * @param {DOMElement} container DOM element to unmount from.
   * @final
   * @internal
   * @see {ReactMount.unmountComponentAtNode}
   */
  unmountComponentFromNode: function(instance, container) {
    instance.unmountComponent();

    if (container.nodeType === DOC_NODE_TYPE) {
      container = container.documentElement;
    }

    // http://jsperf.com/emptying-a-node
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
  },

  /**
   * Finds the container DOM element that contains React component to which the
   * supplied DOM `id` belongs.
   *
   * @param {string} id The ID of an element rendered by a React component.
   * @return {?DOMElement} DOM element that contains the `id`.
   */
  findReactContainerForID: function(id) {
    var reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(id);
    var container = containersByReactRootID[reactRootID];

    if ("production" !== "development") {
      var rootElement = rootElementsByReactRootID[reactRootID];
      if (rootElement && rootElement.parentNode !== container) {
        ("production" !== "development" ? invariant(
          // Call internalGetID here because getID calls isValid which calls
          // findReactContainerForID (this function).
          internalGetID(rootElement) === reactRootID,
          'ReactMount: Root element ID differed from reactRootID.'
        ) : invariant(// Call internalGetID here because getID calls isValid which calls
        // findReactContainerForID (this function).
        internalGetID(rootElement) === reactRootID));

        var containerChild = container.firstChild;
        if (containerChild &&
            reactRootID === internalGetID(containerChild)) {
          // If the container has a new child with the same ID as the old
          // root element, then rootElementsByReactRootID[reactRootID] is
          // just stale and needs to be updated. The case that deserves a
          // warning is when the container is empty.
          rootElementsByReactRootID[reactRootID] = containerChild;
        } else {
          console.warn(
            'ReactMount: Root element has been removed from its original ' +
            'container. New container:', rootElement.parentNode
          );
        }
      }
    }

    return container;
  },

  /**
   * Finds an element rendered by React with the supplied ID.
   *
   * @param {string} id ID of a DOM node in the React component.
   * @return {DOMElement} Root DOM node of the React component.
   */
  findReactNodeByID: function(id) {
    var reactRoot = ReactMount.findReactContainerForID(id);
    return ReactMount.findComponentRoot(reactRoot, id);
  },

  /**
   * True if the supplied `node` is rendered by React.
   *
   * @param {*} node DOM Element to check.
   * @return {boolean} True if the DOM Element appears to be rendered by React.
   * @internal
   */
  isRenderedByReact: function(node) {
    if (node.nodeType !== 1) {
      // Not a DOMElement, therefore not a React component
      return false;
    }
    var id = ReactMount.getID(node);
    return id ? id.charAt(0) === SEPARATOR : false;
  },

  /**
   * Traverses up the ancestors of the supplied node to find a node that is a
   * DOM representation of a React component.
   *
   * @param {*} node
   * @return {?DOMEventTarget}
   * @internal
   */
  getFirstReactDOM: function(node) {
    var current = node;
    while (current && current.parentNode !== current) {
      if (ReactMount.isRenderedByReact(current)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  },

  /**
   * Finds a node with the supplied `targetID` inside of the supplied
   * `ancestorNode`.  Exploits the ID naming scheme to perform the search
   * quickly.
   *
   * @param {DOMEventTarget} ancestorNode Search from this root.
   * @pararm {string} targetID ID of the DOM representation of the component.
   * @return {DOMEventTarget} DOM node with the supplied `targetID`.
   * @internal
   */
  findComponentRoot: function(ancestorNode, targetID) {
    var firstChildren = findComponentRootReusableArray;
    var childIndex = 0;

    var deepestAncestor = findDeepestCachedAncestor(targetID) || ancestorNode;

    firstChildren[0] = deepestAncestor.firstChild;
    firstChildren.length = 1;

    while (childIndex < firstChildren.length) {
      var child = firstChildren[childIndex++];
      var targetChild;

      while (child) {
        var childID = ReactMount.getID(child);
        if (childID) {
          // Even if we find the node we're looking for, we finish looping
          // through its siblings to ensure they're cached so that we don't have
          // to revisit this node again. Otherwise, we make n^2 calls to getID
          // when visiting the many children of a single node in order.

          if (targetID === childID) {
            targetChild = child;
          } else if (ReactInstanceHandles.isAncestorIDOf(childID, targetID)) {
            // If we find a child whose ID is an ancestor of the given ID,
            // then we can be sure that we only want to search the subtree
            // rooted at this child, so we can throw out the rest of the
            // search state.
            firstChildren.length = childIndex = 0;
            firstChildren.push(child.firstChild);
          }

        } else {
          // If this child had no ID, then there's a chance that it was
          // injected automatically by the browser, as when a `<table>`
          // element sprouts an extra `<tbody>` child as a side effect of
          // `.innerHTML` parsing. Optimistically continue down this
          // branch, but not before examining the other siblings.
          firstChildren.push(child.firstChild);
        }

        child = child.nextSibling;
      }

      if (targetChild) {
        // Emptying firstChildren/findComponentRootReusableArray is
        // not necessary for correctness, but it helps the GC reclaim
        // any nodes that were left at the end of the search.
        firstChildren.length = 0;

        return targetChild;
      }
    }

    firstChildren.length = 0;

    ("production" !== "development" ? invariant(
      false,
      'findComponentRoot(..., %s): Unable to find element. This probably ' +
      'means the DOM was unexpectedly mutated (e.g., by the browser). ' +
      'Try inspecting the child nodes of the element with React ID `%s`.',
      targetID,
      ReactMount.getID(ancestorNode)
    ) : invariant(false));
  },


  /**
   * React ID utilities.
   */

  getReactRootID: getReactRootID,

  getID: getID,

  setID: setID,

  getNode: getNode,

  purgeID: purgeID
};

module.exports = ReactMount;

},{"./DOMProperty":8,"./ReactEventEmitter":48,"./ReactInstanceHandles":53,"./ReactPerf":60,"./containsNode":88,"./getReactRootElementInContainer":104,"./invariant":108,"./shouldUpdateReactComponent":126}],56:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMountReady
 */

"use strict";

var PooledClass = require("./PooledClass");

var mixInto = require("./mixInto");

/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `ReactMountReady.getPooled()`.
 *
 * @param {?array<function>} initialCollection
 * @class ReactMountReady
 * @implements PooledClass
 * @internal
 */
function ReactMountReady(initialCollection) {
  this._queue = initialCollection || null;
}

mixInto(ReactMountReady, {

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked. This is used
   * to enqueue calls to `componentDidMount` and `componentDidUpdate`.
   *
   * @param {ReactComponent} component Component being rendered.
   * @param {function(DOMElement)} callback Invoked when `notifyAll` is invoked.
   * @internal
   */
  enqueue: function(component, callback) {
    this._queue = this._queue || [];
    this._queue.push({component: component, callback: callback});
  },

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */
  notifyAll: function() {
    var queue = this._queue;
    if (queue) {
      this._queue = null;
      for (var i = 0, l = queue.length; i < l; i++) {
        var component = queue[i].component;
        var callback = queue[i].callback;
        callback.call(component);
      }
      queue.length = 0;
    }
  },

  /**
   * Resets the internal queue.
   *
   * @internal
   */
  reset: function() {
    this._queue = null;
  },

  /**
   * `PooledClass` looks for this.
   */
  destructor: function() {
    this.reset();
  }

});

PooledClass.addPoolingTo(ReactMountReady);

module.exports = ReactMountReady;

},{"./PooledClass":23,"./mixInto":120}],57:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMultiChild
 * @typechecks static-only
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

var flattenChildren = require("./flattenChildren");
var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");

/**
 * Updating children of a component may trigger recursive updates. The depth is
 * used to batch recursive updates to render markup more efficiently.
 *
 * @type {number}
 * @private
 */
var updateDepth = 0;

/**
 * Queue of update configuration objects.
 *
 * Each object has a `type` property that is in `ReactMultiChildUpdateTypes`.
 *
 * @type {array<object>}
 * @private
 */
var updateQueue = [];

/**
 * Queue of markup to be rendered.
 *
 * @type {array<string>}
 * @private
 */
var markupQueue = [];

/**
 * Enqueues markup to be rendered and inserted at a supplied index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} markup Markup that renders into an element.
 * @param {number} toIndex Destination index.
 * @private
 */
function enqueueMarkup(parentID, markup, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
    markupIndex: markupQueue.push(markup) - 1,
    textContent: null,
    fromIndex: null,
    toIndex: toIndex
  });
}

/**
 * Enqueues moving an existing element to another index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Source index of the existing element.
 * @param {number} toIndex Destination index of the element.
 * @private
 */
function enqueueMove(parentID, fromIndex, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: toIndex
  });
}

/**
 * Enqueues removing an element at an index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Index of the element to remove.
 * @private
 */
function enqueueRemove(parentID, fromIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.REMOVE_NODE,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: null
  });
}

/**
 * Enqueues setting the text content.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} textContent Text content to set.
 * @private
 */
function enqueueTextContent(parentID, textContent) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
    markupIndex: null,
    textContent: textContent,
    fromIndex: null,
    toIndex: null
  });
}

/**
 * Processes any enqueued updates.
 *
 * @private
 */
function processQueue() {
  if (updateQueue.length) {
    ReactComponent.BackendIDOperations.dangerouslyProcessChildrenUpdates(
      updateQueue,
      markupQueue
    );
    clearQueue();
  }
}

/**
 * Clears any enqueued updates.
 *
 * @private
 */
function clearQueue() {
  updateQueue.length = 0;
  markupQueue.length = 0;
}

/**
 * ReactMultiChild are capable of reconciling multiple children.
 *
 * @class ReactMultiChild
 * @internal
 */
var ReactMultiChild = {

  /**
   * Provides common functionality for components that must reconcile multiple
   * children. This is used by `ReactDOMComponent` to mount, update, and
   * unmount child components.
   *
   * @lends {ReactMultiChild.prototype}
   */
  Mixin: {

    /**
     * Generates a "mount image" for each of the supplied children. In the case
     * of `ReactDOMComponent`, a mount image is a string of markup.
     *
     * @param {?object} nestedChildren Nested child maps.
     * @return {array} An array of mounted representations.
     * @internal
     */
    mountChildren: function(nestedChildren, transaction) {
      var children = flattenChildren(nestedChildren);
      var mountImages = [];
      var index = 0;
      this._renderedChildren = children;
      for (var name in children) {
        var child = children[name];
        if (children.hasOwnProperty(name)) {
          // Inlined for performance, see `ReactInstanceHandles.createReactID`.
          var rootID = this._rootNodeID + name;
          var mountImage = child.mountComponent(
            rootID,
            transaction,
            this._mountDepth + 1
          );
          child._mountIndex = index;
          mountImages.push(mountImage);
          index++;
        }
      }
      return mountImages;
    },

    /**
     * Replaces any rendered children with a text content string.
     *
     * @param {string} nextContent String of content.
     * @internal
     */
    updateTextContent: function(nextContent) {
      updateDepth++;
      var errorThrown = true;
      try {
        var prevChildren = this._renderedChildren;
        // Remove any rendered children.
        for (var name in prevChildren) {
          if (prevChildren.hasOwnProperty(name)) {
            this._unmountChildByName(prevChildren[name], name);
          }
        }
        // Set new text content.
        this.setTextContent(nextContent);
        errorThrown = false;
      } finally {
        updateDepth--;
        if (!updateDepth) {
          errorThrown ? clearQueue() : processQueue();
        }
      }
    },

    /**
     * Updates the rendered children with new children.
     *
     * @param {?object} nextNestedChildren Nested child maps.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    updateChildren: function(nextNestedChildren, transaction) {
      updateDepth++;
      var errorThrown = true;
      try {
        this._updateChildren(nextNestedChildren, transaction);
        errorThrown = false;
      } finally {
        updateDepth--;
        if (!updateDepth) {
          errorThrown ? clearQueue() : processQueue();
        }
      }
    },

    /**
     * Improve performance by isolating this hot code path from the try/catch
     * block in `updateChildren`.
     *
     * @param {?object} nextNestedChildren Nested child maps.
     * @param {ReactReconcileTransaction} transaction
     * @final
     * @protected
     */
    _updateChildren: function(nextNestedChildren, transaction) {
      var nextChildren = flattenChildren(nextNestedChildren);
      var prevChildren = this._renderedChildren;
      if (!nextChildren && !prevChildren) {
        return;
      }
      var name;
      // `nextIndex` will increment for each child in `nextChildren`, but
      // `lastIndex` will be the last index visited in `prevChildren`.
      var lastIndex = 0;
      var nextIndex = 0;
      for (name in nextChildren) {
        if (!nextChildren.hasOwnProperty(name)) {
          continue;
        }
        var prevChild = prevChildren && prevChildren[name];
        var nextChild = nextChildren[name];
        if (shouldUpdateReactComponent(prevChild, nextChild)) {
          this.moveChild(prevChild, nextIndex, lastIndex);
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
          prevChild.receiveComponent(nextChild, transaction);
          prevChild._mountIndex = nextIndex;
        } else {
          if (prevChild) {
            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            this._unmountChildByName(prevChild, name);
          }
          this._mountChildByNameAtIndex(
            nextChild, name, nextIndex, transaction
          );
        }
        nextIndex++;
      }
      // Remove children that are no longer present.
      for (name in prevChildren) {
        if (prevChildren.hasOwnProperty(name) &&
            !(nextChildren && nextChildren[name])) {
          this._unmountChildByName(prevChildren[name], name);
        }
      }
    },

    /**
     * Unmounts all rendered children. This should be used to clean up children
     * when this component is unmounted.
     *
     * @internal
     */
    unmountChildren: function() {
      var renderedChildren = this._renderedChildren;
      for (var name in renderedChildren) {
        var renderedChild = renderedChildren[name];
        // TODO: When is this not true?
        if (renderedChild.unmountComponent) {
          renderedChild.unmountComponent();
        }
      }
      this._renderedChildren = null;
    },

    /**
     * Moves a child component to the supplied index.
     *
     * @param {ReactComponent} child Component to move.
     * @param {number} toIndex Destination index of the element.
     * @param {number} lastIndex Last index visited of the siblings of `child`.
     * @protected
     */
    moveChild: function(child, toIndex, lastIndex) {
      // If the index of `child` is less than `lastIndex`, then it needs to
      // be moved. Otherwise, we do not need to move it because a child will be
      // inserted or moved before `child`.
      if (child._mountIndex < lastIndex) {
        enqueueMove(this._rootNodeID, child._mountIndex, toIndex);
      }
    },

    /**
     * Creates a child component.
     *
     * @param {ReactComponent} child Component to create.
     * @param {string} mountImage Markup to insert.
     * @protected
     */
    createChild: function(child, mountImage) {
      enqueueMarkup(this._rootNodeID, mountImage, child._mountIndex);
    },

    /**
     * Removes a child component.
     *
     * @param {ReactComponent} child Child to remove.
     * @protected
     */
    removeChild: function(child) {
      enqueueRemove(this._rootNodeID, child._mountIndex);
    },

    /**
     * Sets this text content string.
     *
     * @param {string} textContent Text content to set.
     * @protected
     */
    setTextContent: function(textContent) {
      enqueueTextContent(this._rootNodeID, textContent);
    },

    /**
     * Mounts a child with the supplied name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to mount.
     * @param {string} name Name of the child.
     * @param {number} index Index at which to insert the child.
     * @param {ReactReconcileTransaction} transaction
     * @private
     */
    _mountChildByNameAtIndex: function(child, name, index, transaction) {
      // Inlined for performance, see `ReactInstanceHandles.createReactID`.
      var rootID = this._rootNodeID + name;
      var mountImage = child.mountComponent(
        rootID,
        transaction,
        this._mountDepth + 1
      );
      child._mountIndex = index;
      this.createChild(child, mountImage);
      this._renderedChildren = this._renderedChildren || {};
      this._renderedChildren[name] = child;
    },

    /**
     * Unmounts a rendered child by name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to unmount.
     * @param {string} name Name of the child in `this._renderedChildren`.
     * @private
     */
    _unmountChildByName: function(child, name) {
      // TODO: When is this not true?
      if (ReactComponent.isValidComponent(child)) {
        this.removeChild(child);
        child._mountIndex = null;
        child.unmountComponent();
        delete this._renderedChildren[name];
      }
    }

  }

};

module.exports = ReactMultiChild;

},{"./ReactComponent":26,"./ReactMultiChildUpdateTypes":58,"./flattenChildren":97,"./shouldUpdateReactComponent":126}],58:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMultiChildUpdateTypes
 */

"use strict";

var keyMirror = require("./keyMirror");

/**
 * When a component's children are updated, a series of update configuration
 * objects are created in order to batch and serialize the required changes.
 *
 * Enumerates all the possible types of update configurations.
 *
 * @internal
 */
var ReactMultiChildUpdateTypes = keyMirror({
  INSERT_MARKUP: null,
  MOVE_EXISTING: null,
  REMOVE_NODE: null,
  TEXT_CONTENT: null
});

module.exports = ReactMultiChildUpdateTypes;

},{"./keyMirror":114}],59:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactOwner
 */

"use strict";

var invariant = require("./invariant");

/**
 * ReactOwners are capable of storing references to owned components.
 *
 * All components are capable of //being// referenced by owner components, but
 * only ReactOwner components are capable of //referencing// owned components.
 * The named reference is known as a "ref".
 *
 * Refs are available when mounted and updated during reconciliation.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: function() {
 *       this.refs.custom.handleClick();
 *     },
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs should rarely be used. When refs are used, they should only be done to
 * control data that is not handled by React's data flow.
 *
 * @class ReactOwner
 */
var ReactOwner = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid owner.
   * @final
   */
  isValidOwner: function(object) {
    return !!(
      object &&
      typeof object.attachRef === 'function' &&
      typeof object.detachRef === 'function'
    );
  },

  /**
   * Adds a component by ref to an owner component.
   *
   * @param {ReactComponent} component Component to reference.
   * @param {string} ref Name by which to refer to the component.
   * @param {ReactOwner} owner Component on which to record the ref.
   * @final
   * @internal
   */
  addComponentAsRefTo: function(component, ref, owner) {
    ("production" !== "development" ? invariant(
      ReactOwner.isValidOwner(owner),
      'addComponentAsRefTo(...): Only a ReactOwner can have refs. This ' +
      'usually means that you\'re trying to add a ref to a component that ' +
      'doesn\'t have an owner (that is, was not created inside of another ' +
      'component\'s `render` method). Try rendering this component inside of ' +
      'a new top-level component which will hold the ref.'
    ) : invariant(ReactOwner.isValidOwner(owner)));
    owner.attachRef(ref, component);
  },

  /**
   * Removes a component by ref from an owner component.
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function(component, ref, owner) {
    ("production" !== "development" ? invariant(
      ReactOwner.isValidOwner(owner),
      'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. This ' +
      'usually means that you\'re trying to remove a ref to a component that ' +
      'doesn\'t have an owner (that is, was not created inside of another ' +
      'component\'s `render` method). Try rendering this component inside of ' +
      'a new top-level component which will hold the ref.'
    ) : invariant(ReactOwner.isValidOwner(owner)));
    // Check that `component` is still the current ref because we do not want to
    // detach the ref if another component stole it.
    if (owner.refs[ref] === component) {
      owner.detachRef(ref);
    }
  },

  /**
   * A ReactComponent must mix this in to have refs.
   *
   * @lends {ReactOwner.prototype}
   */
  Mixin: {

    /**
     * Lazily allocates the refs object and stores `component` as `ref`.
     *
     * @param {string} ref Reference name.
     * @param {component} component Component to store as `ref`.
     * @final
     * @private
     */
    attachRef: function(ref, component) {
      ("production" !== "development" ? invariant(
        component.isOwnedBy(this),
        'attachRef(%s, ...): Only a component\'s owner can store a ref to it.',
        ref
      ) : invariant(component.isOwnedBy(this)));
      var refs = this.refs || (this.refs = {});
      refs[ref] = component;
    },

    /**
     * Detaches a reference name.
     *
     * @param {string} ref Name to dereference.
     * @final
     * @private
     */
    detachRef: function(ref) {
      delete this.refs[ref];
    }

  }

};

module.exports = ReactOwner;

},{"./invariant":108}],60:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPerf
 * @typechecks static-only
 */

"use strict";

/**
 * ReactPerf is a general AOP system designed to measure performance. This
 * module only has the hooks: see ReactDefaultPerf for the analysis tool.
 */
var ReactPerf = {
  /**
   * Boolean to enable/disable measurement. Set to false by default to prevent
   * accidental logging and perf loss.
   */
  enableMeasure: false,

  /**
   * Holds onto the measure function in use. By default, don't measure
   * anything, but we'll override this if we inject a measure function.
   */
  storedMeasure: _noMeasure,

  /**
   * Use this to wrap methods you want to measure. Zero overhead in production.
   *
   * @param {string} objName
   * @param {string} fnName
   * @param {function} func
   * @return {function}
   */
  measure: function(objName, fnName, func) {
    if ("production" !== "development") {
      var measuredFunc = null;
      return function() {
        if (ReactPerf.enableMeasure) {
          if (!measuredFunc) {
            measuredFunc = ReactPerf.storedMeasure(objName, fnName, func);
          }
          return measuredFunc.apply(this, arguments);
        }
        return func.apply(this, arguments);
      };
    }
    return func;
  },

  injection: {
    /**
     * @param {function} measure
     */
    injectMeasure: function(measure) {
      ReactPerf.storedMeasure = measure;
    }
  }
};

/**
 * Simply passes through the measured function, without measuring it.
 *
 * @param {string} objName
 * @param {string} fnName
 * @param {function} func
 * @return {function}
 */
function _noMeasure(objName, fnName, func) {
  return func;
}

module.exports = ReactPerf;

},{}],61:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTransferer
 */

"use strict";

var emptyFunction = require("./emptyFunction");
var invariant = require("./invariant");
var joinClasses = require("./joinClasses");
var merge = require("./merge");

/**
 * Creates a transfer strategy that will merge prop values using the supplied
 * `mergeStrategy`. If a prop was previously unset, this just sets it.
 *
 * @param {function} mergeStrategy
 * @return {function}
 */
function createTransferStrategy(mergeStrategy) {
  return function(props, key, value) {
    if (!props.hasOwnProperty(key)) {
      props[key] = value;
    } else {
      props[key] = mergeStrategy(props[key], value);
    }
  };
}

/**
 * Transfer strategies dictate how props are transferred by `transferPropsTo`.
 * NOTE: if you add any more exceptions to this list you should be sure to
 * update `cloneWithProps()` accordingly.
 */
var TransferStrategies = {
  /**
   * Never transfer `children`.
   */
  children: emptyFunction,
  /**
   * Transfer the `className` prop by merging them.
   */
  className: createTransferStrategy(joinClasses),
  /**
   * Never transfer the `key` prop.
   */
  key: emptyFunction,
  /**
   * Never transfer the `ref` prop.
   */
  ref: emptyFunction,
  /**
   * Transfer the `style` prop (which is an object) by merging them.
   */
  style: createTransferStrategy(merge)
};

/**
 * ReactPropTransferer are capable of transferring props to another component
 * using a `transferPropsTo` method.
 *
 * @class ReactPropTransferer
 */
var ReactPropTransferer = {

  TransferStrategies: TransferStrategies,

  /**
   * Merge two props objects using TransferStrategies.
   *
   * @param {object} oldProps original props (they take precedence)
   * @param {object} newProps new props to merge in
   * @return {object} a new object containing both sets of props merged.
   */
  mergeProps: function(oldProps, newProps) {
    var props = merge(oldProps);

    for (var thisKey in newProps) {
      if (!newProps.hasOwnProperty(thisKey)) {
        continue;
      }

      var transferStrategy = TransferStrategies[thisKey];

      if (transferStrategy) {
        transferStrategy(props, thisKey, newProps[thisKey]);
      } else if (!props.hasOwnProperty(thisKey)) {
        props[thisKey] = newProps[thisKey];
      }
    }

    return props;
  },

  /**
   * @lends {ReactPropTransferer.prototype}
   */
  Mixin: {

    /**
     * Transfer props from this component to a target component.
     *
     * Props that do not have an explicit transfer strategy will be transferred
     * only if the target component does not already have the prop set.
     *
     * This is usually used to pass down props to a returned root component.
     *
     * @param {ReactComponent} component Component receiving the properties.
     * @return {ReactComponent} The supplied `component`.
     * @final
     * @protected
     */
    transferPropsTo: function(component) {
      ("production" !== "development" ? invariant(
        component._owner === this,
        '%s: You can\'t call transferPropsTo() on a component that you ' +
        'don\'t own, %s. This usually means you are calling ' +
        'transferPropsTo() on a component passed in as props or children.',
        this.constructor.displayName,
        component.constructor.displayName
      ) : invariant(component._owner === this));

      component.props = ReactPropTransferer.mergeProps(
        component.props,
        this.props
      );

      return component;
    }

  }
};

module.exports = ReactPropTransferer;

},{"./emptyFunction":95,"./invariant":108,"./joinClasses":113,"./merge":117}],62:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTypeLocationNames
 */

"use strict";

var ReactPropTypeLocationNames = {};

if ("production" !== "development") {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
}

module.exports = ReactPropTypeLocationNames;

},{}],63:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTypeLocations
 */

"use strict";

var keyMirror = require("./keyMirror");

var ReactPropTypeLocations = keyMirror({
  prop: null,
  context: null,
  childContext: null
});

module.exports = ReactPropTypeLocations;

},{"./keyMirror":114}],64:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTypes
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactPropTypeLocationNames = require("./ReactPropTypeLocationNames");

var warning = require("./warning");
var createObjectFrom = require("./createObjectFrom");

/**
 * Collection of methods that allow declaration and validation of props that are
 * supplied to React components. Example usage:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyArticle = React.createClass({
 *     propTypes: {
 *       // An optional string prop named "description".
 *       description: Props.string,
 *
 *       // A required enum prop named "category".
 *       category: Props.oneOf(['News','Photos']).isRequired,
 *
 *       // A prop named "dialog" that requires an instance of Dialog.
 *       dialog: Props.instanceOf(Dialog).isRequired
 *     },
 *     render: function() { ... }
 *   });
 *
 * A more formal specification of how these methods are used:
 *
 *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
 *   decl := ReactPropTypes.{type}(.isRequired)?
 *
 * Each and every declaration produces a function with the same signature. This
 * allows the creation of custom validation functions. For example:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyLink = React.createClass({
 *     propTypes: {
 *       // An optional string or URI prop named "href".
 *       href: function(props, propName, componentName) {
 *         var propValue = props[propName];
 *         warning(
 *           propValue == null ||
 *           typeof propValue === 'string' ||
 *           propValue instanceof URI,
 *           'Invalid `%s` supplied to `%s`, expected string or URI.',
 *           propName,
 *           componentName
 *         );
 *       }
 *     },
 *     render: function() { ... }
 *   });
 *
 * @internal
 */
var Props = {

  array: createPrimitiveTypeChecker('array'),
  bool: createPrimitiveTypeChecker('boolean'),
  func: createPrimitiveTypeChecker('function'),
  number: createPrimitiveTypeChecker('number'),
  object: createPrimitiveTypeChecker('object'),
  string: createPrimitiveTypeChecker('string'),

  shape: createShapeTypeChecker,
  oneOf: createEnumTypeChecker,
  oneOfType: createUnionTypeChecker,
  arrayOf: createArrayOfTypeChecker,

  instanceOf: createInstanceTypeChecker,

  renderable: createRenderableTypeChecker(),

  component: createComponentTypeChecker(),

  any: createAnyTypeChecker()
};

var ANONYMOUS = '<<anonymous>>';

function isRenderable(propValue) {
  switch(typeof propValue) {
    case 'number':
    case 'string':
      return true;
    case 'object':
      if (Array.isArray(propValue)) {
        return propValue.every(isRenderable);
      }
      if (ReactComponent.isValidComponent(propValue)) {
        return true;
      }
      for (var k in propValue) {
        if (!isRenderable(propValue[k])) {
          return false;
        }
      }
      return true;
    default:
      return false;
  }
}

// Equivalent of typeof but with special handling for arrays
function getPropType(propValue) {
  var propType = typeof propValue;
  if (propType === 'object' && Array.isArray(propValue)) {
    return 'array';
  }
  return propType;
}

function createAnyTypeChecker() {
  function validateAnyType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    return true; // is always valid
  }
  return createChainableTypeChecker(validateAnyType);
}

function createPrimitiveTypeChecker(expectedType) {
  function validatePrimitiveType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var propType = getPropType(propValue);
    var isValid = propType === expectedType;
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` of type `%s` supplied to `%s`, expected `%s`.',
        ReactPropTypeLocationNames[location],
        propName,
        propType,
        componentName,
        expectedType
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validatePrimitiveType);
}

function createEnumTypeChecker(expectedValues) {
  var expectedEnum = createObjectFrom(expectedValues);
  function validateEnumType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = expectedEnum[propValue];
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected one of %s.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName,
        JSON.stringify(Object.keys(expectedEnum))
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateEnumType);
}

function createShapeTypeChecker(shapeTypes) {
  function validateShapeType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var propType = getPropType(propValue);
    var isValid = propType === 'object';
    if (isValid) {
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (checker && !checker(propValue, key, componentName, location)) {
          return false;
        }
      }
    }
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` of type `%s` supplied to `%s`, expected `object`.',
        ReactPropTypeLocationNames[location],
        propName,
        propType,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateShapeType);
}

function createInstanceTypeChecker(expectedClass) {
  function validateInstanceType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = propValue instanceof expectedClass;
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected instance of `%s`.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName,
        expectedClass.name || ANONYMOUS
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateInstanceType);
}

function createArrayOfTypeChecker(propTypeChecker) {
  function validateArrayType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = Array.isArray(propValue);
    if (isValid) {
      for (var i = 0; i < propValue.length; i++) {
        if (!propTypeChecker(propValue, i, componentName, location)) {
          return false;
        }
      }
    }
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected an array.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateArrayType);
}

function createRenderableTypeChecker() {
  function validateRenderableType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = isRenderable(propValue);
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected a renderable prop.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateRenderableType);
}

function createComponentTypeChecker() {
  function validateComponentType(
    shouldWarn, propValue, propName, componentName, location
  ) {
    var isValid = ReactComponent.isValidComponent(propValue);
    if (shouldWarn) {
      ("production" !== "development" ? warning(
        isValid,
        'Invalid %s `%s` supplied to `%s`, expected a React component.',
        ReactPropTypeLocationNames[location],
        propName,
        componentName
      ) : null);
    }
    return isValid;
  }
  return createChainableTypeChecker(validateComponentType);
}

function createUnionTypeChecker(arrayOfValidators) {
  return function(props, propName, componentName, location) {
    var isValid = false;
    for (var ii = 0; ii < arrayOfValidators.length; ii++) {
      var validate = arrayOfValidators[ii];
      if (typeof validate.weak === 'function') {
        validate = validate.weak;
      }
      if (validate(props, propName, componentName, location)) {
        isValid = true;
        break;
      }
    }
    ("production" !== "development" ? warning(
      isValid,
      'Invalid %s `%s` supplied to `%s`.',
      ReactPropTypeLocationNames[location],
      propName,
      componentName || ANONYMOUS
    ) : null);
    return isValid;
  };
}

function createChainableTypeChecker(validate) {
  function checkType(
    isRequired, shouldWarn, props, propName, componentName, location
  ) {
    var propValue = props[propName];
    if (propValue != null) {
      // Only validate if there is a value to check.
      return validate(
        shouldWarn,
        propValue,
        propName,
        componentName || ANONYMOUS,
        location
      );
    } else {
      var isValid = !isRequired;
      if (shouldWarn) {
        ("production" !== "development" ? warning(
          isValid,
          'Required %s `%s` was not specified in `%s`.',
          ReactPropTypeLocationNames[location],
          propName,
          componentName || ANONYMOUS
        ) : null);
      }
      return isValid;
    }
  }

  var checker = checkType.bind(null, false, true);
  checker.weak = checkType.bind(null, false, false);
  checker.isRequired = checkType.bind(null, true, true);
  checker.weak.isRequired = checkType.bind(null, true, false);
  checker.isRequired.weak = checker.weak.isRequired;

  return checker;
}

module.exports = Props;

},{"./ReactComponent":26,"./ReactPropTypeLocationNames":62,"./createObjectFrom":93,"./warning":129}],65:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPutListenerQueue
 */

"use strict";

var PooledClass = require("./PooledClass");
var ReactEventEmitter = require("./ReactEventEmitter");

var mixInto = require("./mixInto");

function ReactPutListenerQueue() {
  this.listenersToPut = [];
}

mixInto(ReactPutListenerQueue, {
  enqueuePutListener: function(rootNodeID, propKey, propValue) {
    this.listenersToPut.push({
      rootNodeID: rootNodeID,
      propKey: propKey,
      propValue: propValue
    });
  },

  putListeners: function() {
    for (var i = 0; i < this.listenersToPut.length; i++) {
      var listenerToPut = this.listenersToPut[i];
      ReactEventEmitter.putListener(
        listenerToPut.rootNodeID,
        listenerToPut.propKey,
        listenerToPut.propValue
      );
    }
  },

  reset: function() {
    this.listenersToPut.length = 0;
  },

  destructor: function() {
    this.reset();
  }
});

PooledClass.addPoolingTo(ReactPutListenerQueue);

module.exports = ReactPutListenerQueue;

},{"./PooledClass":23,"./ReactEventEmitter":48,"./mixInto":120}],66:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactReconcileTransaction
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");
var PooledClass = require("./PooledClass");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInputSelection = require("./ReactInputSelection");
var ReactMountReady = require("./ReactMountReady");
var ReactPutListenerQueue = require("./ReactPutListenerQueue");
var Transaction = require("./Transaction");

var mixInto = require("./mixInto");

/**
 * Ensures that, when possible, the selection range (currently selected text
 * input) is not disturbed by performing the transaction.
 */
var SELECTION_RESTORATION = {
  /**
   * @return {Selection} Selection information.
   */
  initialize: ReactInputSelection.getSelectionInformation,
  /**
   * @param {Selection} sel Selection information returned from `initialize`.
   */
  close: ReactInputSelection.restoreSelection
};

/**
 * Suppresses events (blur/focus) that could be inadvertently dispatched due to
 * high level DOM manipulations (like temporarily removing a text input from the
 * DOM).
 */
var EVENT_SUPPRESSION = {
  /**
   * @return {boolean} The enabled status of `ReactEventEmitter` before the
   * reconciliation.
   */
  initialize: function() {
    var currentlyEnabled = ReactEventEmitter.isEnabled();
    ReactEventEmitter.setEnabled(false);
    return currentlyEnabled;
  },

  /**
   * @param {boolean} previouslyEnabled Enabled status of `ReactEventEmitter`
   *   before the reconciliation occured. `close` restores the previous value.
   */
  close: function(previouslyEnabled) {
    ReactEventEmitter.setEnabled(previouslyEnabled);
  }
};

/**
 * Provides a `ReactMountReady` queue for collecting `onDOMReady` callbacks
 * during the performing of the transaction.
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * Initializes the internal `onDOMReady` queue.
   */
  initialize: function() {
    this.reactMountReady.reset();
  },

  /**
   * After DOM is flushed, invoke all registered `onDOMReady` callbacks.
   */
  close: function() {
    this.reactMountReady.notifyAll();
  }
};

var PUT_LISTENER_QUEUEING = {
  initialize: function() {
    this.putListenerQueue.reset();
  },

  close: function() {
    this.putListenerQueue.putListeners();
  }
};

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [
  PUT_LISTENER_QUEUEING,
  SELECTION_RESTORATION,
  EVENT_SUPPRESSION,
  ON_DOM_READY_QUEUEING
];

/**
 * Currently:
 * - The order that these are listed in the transaction is critical:
 * - Suppresses events.
 * - Restores selection range.
 *
 * Future:
 * - Restore document/overflow scroll positions that were unintentionally
 *   modified via DOM insertions above the top viewport boundary.
 * - Implement/integrate with customized constraint based layout system and keep
 *   track of which dimensions must be remeasured.
 *
 * @class ReactReconcileTransaction
 */
function ReactReconcileTransaction() {
  this.reinitializeTransaction();
  this.reactMountReady = ReactMountReady.getPooled(null);
  this.putListenerQueue = ReactPutListenerQueue.getPooled();
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array<object>} List of operation wrap proceedures.
   *   TODO: convert to array<TransactionWrapper>
   */
  getTransactionWrappers: function() {
    if (ExecutionEnvironment.canUseDOM) {
      return TRANSACTION_WRAPPERS;
    } else {
      return [];
    }
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   *   TODO: convert to ReactMountReady
   */
  getReactMountReady: function() {
    return this.reactMountReady;
  },

  getPutListenerQueue: function() {
    return this.putListenerQueue;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be resused.
   */
  destructor: function() {
    ReactMountReady.release(this.reactMountReady);
    this.reactMountReady = null;

    ReactPutListenerQueue.release(this.putListenerQueue);
    this.putListenerQueue = null;
  }
};


mixInto(ReactReconcileTransaction, Transaction.Mixin);
mixInto(ReactReconcileTransaction, Mixin);

PooledClass.addPoolingTo(ReactReconcileTransaction);

module.exports = ReactReconcileTransaction;

},{"./ExecutionEnvironment":20,"./PooledClass":23,"./ReactEventEmitter":48,"./ReactInputSelection":52,"./ReactMountReady":56,"./ReactPutListenerQueue":65,"./Transaction":84,"./mixInto":120}],67:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactRootIndex
 * @typechecks
 */

"use strict";

var ReactRootIndexInjection = {
  /**
   * @param {function} _createReactRootIndex
   */
  injectCreateReactRootIndex: function(_createReactRootIndex) {
    ReactRootIndex.createReactRootIndex = _createReactRootIndex;
  }
};

var ReactRootIndex = {
  createReactRootIndex: null,
  injection: ReactRootIndexInjection
};

module.exports = ReactRootIndex;

},{}],68:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @typechecks static-only
 * @providesModule ReactServerRendering
 */
"use strict";

var ReactComponent = require("./ReactComponent");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");

var invariant = require("./invariant");

/**
 * @param {ReactComponent} component
 * @return {string} the markup
 */
function renderComponentToString(component) {
  ("production" !== "development" ? invariant(
    ReactComponent.isValidComponent(component),
    'renderComponentToString(): You must pass a valid ReactComponent.'
  ) : invariant(ReactComponent.isValidComponent(component)));

  ("production" !== "development" ? invariant(
    !(arguments.length === 2 && typeof arguments[1] === 'function'),
    'renderComponentToString(): This function became synchronous and now ' +
    'returns the generated markup. Please remove the second parameter.'
  ) : invariant(!(arguments.length === 2 && typeof arguments[1] === 'function')));

  var id = ReactInstanceHandles.createReactRootID();
  var transaction = ReactReconcileTransaction.getPooled();
  transaction.reinitializeTransaction();
  try {
    return transaction.perform(function() {
      var markup = component.mountComponent(id, transaction, 0);
      return ReactMarkupChecksum.addChecksumToMarkup(markup);
    }, null);
  } finally {
    ReactReconcileTransaction.release(transaction);
  }
}

module.exports = {
  renderComponentToString: renderComponentToString
};

},{"./ReactComponent":26,"./ReactInstanceHandles":53,"./ReactMarkupChecksum":54,"./ReactReconcileTransaction":66,"./invariant":108}],69:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactTextComponent
 * @typechecks static-only
 */

"use strict";

var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponent = require("./ReactComponent");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var mixInto = require("./mixInto");

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings in elements so that they can undergo
 * the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactTextComponent = function(initialText) {
  this.construct({text: initialText});
};

mixInto(ReactTextComponent, ReactComponent.Mixin);
mixInto(ReactTextComponent, {

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction} transaction
   * @param {number} mountDepth number of components in the owner hierarchy
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(rootID, transaction, mountDepth) {
    ReactComponent.Mixin.mountComponent.call(
      this,
      rootID,
      transaction,
      mountDepth
    );
    return (
      '<span ' + DOMPropertyOperations.createMarkupForID(rootID) + '>' +
        escapeTextForBrowser(this.props.text) +
      '</span>'
    );
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {object} nextComponent Contains the next text content.
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveComponent: function(nextComponent, transaction) {
    var nextProps = nextComponent.props;
    if (nextProps.text !== this.props.text) {
      this.props.text = nextProps.text;
      ReactComponent.BackendIDOperations.updateTextContentByID(
        this._rootNodeID,
        nextProps.text
      );
    }
  }

});

// Expose the constructor on itself and the prototype for consistency with other
// descriptors.
ReactTextComponent.type = ReactTextComponent;
ReactTextComponent.prototype.type = ReactTextComponent;

module.exports = ReactTextComponent;

},{"./DOMPropertyOperations":9,"./ReactComponent":26,"./escapeTextForBrowser":96,"./mixInto":120}],70:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactUpdates
 */

"use strict";

var ReactPerf = require("./ReactPerf");

var invariant = require("./invariant");

var dirtyComponents = [];

var batchingStrategy = null;

function ensureBatchingStrategy() {
  ("production" !== "development" ? invariant(batchingStrategy, 'ReactUpdates: must inject a batching strategy') : invariant(batchingStrategy));
}

function batchedUpdates(callback, param) {
  ensureBatchingStrategy();
  batchingStrategy.batchedUpdates(callback, param);
}

/**
 * Array comparator for ReactComponents by owner depth
 *
 * @param {ReactComponent} c1 first component you're comparing
 * @param {ReactComponent} c2 second component you're comparing
 * @return {number} Return value usable by Array.prototype.sort().
 */
function mountDepthComparator(c1, c2) {
  return c1._mountDepth - c2._mountDepth;
}

function runBatchedUpdates() {
  // Since reconciling a component higher in the owner hierarchy usually (not
  // always -- see shouldComponentUpdate()) will reconcile children, reconcile
  // them before their children by sorting the array.

  dirtyComponents.sort(mountDepthComparator);

  for (var i = 0; i < dirtyComponents.length; i++) {
    // If a component is unmounted before pending changes apply, ignore them
    // TODO: Queue unmounts in the same list to avoid this happening at all
    var component = dirtyComponents[i];
    if (component.isMounted()) {
      // If performUpdateIfNecessary happens to enqueue any new updates, we
      // shouldn't execute the callbacks until the next render happens, so
      // stash the callbacks first
      var callbacks = component._pendingCallbacks;
      component._pendingCallbacks = null;
      component.performUpdateIfNecessary();
      if (callbacks) {
        for (var j = 0; j < callbacks.length; j++) {
          callbacks[j].call(component);
        }
      }
    }
  }
}

function clearDirtyComponents() {
  dirtyComponents.length = 0;
}

var flushBatchedUpdates = ReactPerf.measure(
  'ReactUpdates',
  'flushBatchedUpdates',
  function() {
    // Run these in separate functions so the JIT can optimize
    try {
      runBatchedUpdates();
    } finally {
      clearDirtyComponents();
    }
  }
);

/**
 * Mark a component as needing a rerender, adding an optional callback to a
 * list of functions which will be executed once the rerender occurs.
 */
function enqueueUpdate(component, callback) {
  ("production" !== "development" ? invariant(
    !callback || typeof callback === "function",
    'enqueueUpdate(...): You called `setProps`, `replaceProps`, ' +
    '`setState`, `replaceState`, or `forceUpdate` with a callback that ' +
    'isn\'t callable.'
  ) : invariant(!callback || typeof callback === "function"));
  ensureBatchingStrategy();

  if (!batchingStrategy.isBatchingUpdates) {
    component.performUpdateIfNecessary();
    callback && callback.call(component);
    return;
  }

  dirtyComponents.push(component);

  if (callback) {
    if (component._pendingCallbacks) {
      component._pendingCallbacks.push(callback);
    } else {
      component._pendingCallbacks = [callback];
    }
  }
}

var ReactUpdatesInjection = {
  injectBatchingStrategy: function(_batchingStrategy) {
    ("production" !== "development" ? invariant(
      _batchingStrategy,
      'ReactUpdates: must provide a batching strategy'
    ) : invariant(_batchingStrategy));
    ("production" !== "development" ? invariant(
      typeof _batchingStrategy.batchedUpdates === 'function',
      'ReactUpdates: must provide a batchedUpdates() function'
    ) : invariant(typeof _batchingStrategy.batchedUpdates === 'function'));
    ("production" !== "development" ? invariant(
      typeof _batchingStrategy.isBatchingUpdates === 'boolean',
      'ReactUpdates: must provide an isBatchingUpdates boolean attribute'
    ) : invariant(typeof _batchingStrategy.isBatchingUpdates === 'boolean'));
    batchingStrategy = _batchingStrategy;
  }
};

var ReactUpdates = {
  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate,
  flushBatchedUpdates: flushBatchedUpdates,
  injection: ReactUpdatesInjection
};

module.exports = ReactUpdates;

},{"./ReactPerf":60,"./invariant":108}],71:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SelectEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ReactInputSelection = require("./ReactInputSelection");
var SyntheticEvent = require("./SyntheticEvent");

var getActiveElement = require("./getActiveElement");
var isTextInputElement = require("./isTextInputElement");
var keyOf = require("./keyOf");
var shallowEqual = require("./shallowEqual");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  select: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSelect: null}),
      captured: keyOf({onSelectCapture: null})
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topContextMenu,
      topLevelTypes.topFocus,
      topLevelTypes.topKeyDown,
      topLevelTypes.topMouseDown,
      topLevelTypes.topMouseUp,
      topLevelTypes.topSelectionChange
    ]
  }
};

var activeElement = null;
var activeElementID = null;
var lastSelection = null;
var mouseDown = false;

/**
 * Get an object which is a unique representation of the current selection.
 *
 * The return value will not be consistent across nodes or browsers, but
 * two identical selections on the same node will return identical objects.
 *
 * @param {DOMElement} node
 * @param {object}
 */
function getSelection(node) {
  if ('selectionStart' in node &&
      ReactInputSelection.hasSelectionCapabilities(node)) {
    return {
      start: node.selectionStart,
      end: node.selectionEnd
    };
  } else if (document.selection) {
    var range = document.selection.createRange();
    return {
      parentElement: range.parentElement(),
      text: range.text,
      top: range.boundingTop,
      left: range.boundingLeft
    };
  } else {
    var selection = window.getSelection();
    return {
      anchorNode: selection.anchorNode,
      anchorOffset: selection.anchorOffset,
      focusNode: selection.focusNode,
      focusOffset: selection.focusOffset
    };
  }
}

/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @return {?SyntheticEvent}
 */
function constructSelectEvent(nativeEvent) {
  // Ensure we have the right element, and that the user is not dragging a
  // selection (this matches native `select` event behavior). In HTML5, select
  // fires only on input and textarea thus if there's no focused element we
  // won't dispatch.
  if (mouseDown ||
      activeElement == null ||
      activeElement != getActiveElement()) {
    return;
  }

  // Only fire when selection has actually changed.
  var currentSelection = getSelection(activeElement);
  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
    lastSelection = currentSelection;

    var syntheticEvent = SyntheticEvent.getPooled(
      eventTypes.select,
      activeElementID,
      nativeEvent
    );

    syntheticEvent.type = 'select';
    syntheticEvent.target = activeElement;

    EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);

    return syntheticEvent;
  }
}

/**
 * This plugin creates an `onSelect` event that normalizes select events
 * across form elements.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - contentEditable
 *
 * This differs from native browser implementations in the following ways:
 * - Fires on contentEditable fields as well as inputs.
 * - Fires for collapsed selection.
 * - Fires after user input.
 */
var SelectEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    switch (topLevelType) {
      // Track the input node that has focus.
      case topLevelTypes.topFocus:
        if (isTextInputElement(topLevelTarget) ||
            topLevelTarget.contentEditable === 'true') {
          activeElement = topLevelTarget;
          activeElementID = topLevelTargetID;
          lastSelection = null;
        }
        break;
      case topLevelTypes.topBlur:
        activeElement = null;
        activeElementID = null;
        lastSelection = null;
        break;

      // Don't fire the event while the user is dragging. This matches the
      // semantics of the native select event.
      case topLevelTypes.topMouseDown:
        mouseDown = true;
        break;
      case topLevelTypes.topContextMenu:
      case topLevelTypes.topMouseUp:
        mouseDown = false;
        return constructSelectEvent(nativeEvent);

      // Chrome and IE fire non-standard event when selection is changed (and
      // sometimes when it hasn't).
      // Firefox doesn't support selectionchange, so check selection status
      // after each key entry. The selection changes after keydown and before
      // keyup, but we check on keydown as well in the case of holding down a
      // key, when multiple keydown events are fired but only one keyup is.
      case topLevelTypes.topSelectionChange:
      case topLevelTypes.topKeyDown:
      case topLevelTypes.topKeyUp:
        return constructSelectEvent(nativeEvent);
    }
  }
};

module.exports = SelectEventPlugin;

},{"./EventConstants":14,"./EventPropagators":19,"./ReactInputSelection":52,"./SyntheticEvent":77,"./getActiveElement":99,"./isTextInputElement":111,"./keyOf":115,"./shallowEqual":125}],72:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ServerReactRootIndex
 * @typechecks
 */

"use strict";

/**
 * Size of the reactRoot ID space. We generate random numbers for React root
 * IDs and if there's a collision the events and DOM update system will
 * get confused. In the future we need a way to generate GUIDs but for
 * now this will work on a smaller scale.
 */
var GLOBAL_MOUNT_POINT_MAX = Math.pow(2, 53);

var ServerReactRootIndex = {
  createReactRootIndex: function() {
    return Math.ceil(Math.random() * GLOBAL_MOUNT_POINT_MAX);
  }
};

module.exports = ServerReactRootIndex;

},{}],73:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SimpleEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPluginUtils = require("./EventPluginUtils");
var EventPropagators = require("./EventPropagators");
var SyntheticClipboardEvent = require("./SyntheticClipboardEvent");
var SyntheticEvent = require("./SyntheticEvent");
var SyntheticFocusEvent = require("./SyntheticFocusEvent");
var SyntheticKeyboardEvent = require("./SyntheticKeyboardEvent");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");
var SyntheticDragEvent = require("./SyntheticDragEvent");
var SyntheticTouchEvent = require("./SyntheticTouchEvent");
var SyntheticUIEvent = require("./SyntheticUIEvent");
var SyntheticWheelEvent = require("./SyntheticWheelEvent");

var invariant = require("./invariant");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  blur: {
    phasedRegistrationNames: {
      bubbled: keyOf({onBlur: true}),
      captured: keyOf({onBlurCapture: true})
    }
  },
  click: {
    phasedRegistrationNames: {
      bubbled: keyOf({onClick: true}),
      captured: keyOf({onClickCapture: true})
    }
  },
  contextMenu: {
    phasedRegistrationNames: {
      bubbled: keyOf({onContextMenu: true}),
      captured: keyOf({onContextMenuCapture: true})
    }
  },
  copy: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCopy: true}),
      captured: keyOf({onCopyCapture: true})
    }
  },
  cut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCut: true}),
      captured: keyOf({onCutCapture: true})
    }
  },
  doubleClick: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDoubleClick: true}),
      captured: keyOf({onDoubleClickCapture: true})
    }
  },
  drag: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrag: true}),
      captured: keyOf({onDragCapture: true})
    }
  },
  dragEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnd: true}),
      captured: keyOf({onDragEndCapture: true})
    }
  },
  dragEnter: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnter: true}),
      captured: keyOf({onDragEnterCapture: true})
    }
  },
  dragExit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragExit: true}),
      captured: keyOf({onDragExitCapture: true})
    }
  },
  dragLeave: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragLeave: true}),
      captured: keyOf({onDragLeaveCapture: true})
    }
  },
  dragOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragOver: true}),
      captured: keyOf({onDragOverCapture: true})
    }
  },
  dragStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragStart: true}),
      captured: keyOf({onDragStartCapture: true})
    }
  },
  drop: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrop: true}),
      captured: keyOf({onDropCapture: true})
    }
  },
  focus: {
    phasedRegistrationNames: {
      bubbled: keyOf({onFocus: true}),
      captured: keyOf({onFocusCapture: true})
    }
  },
  input: {
    phasedRegistrationNames: {
      bubbled: keyOf({onInput: true}),
      captured: keyOf({onInputCapture: true})
    }
  },
  keyDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyDown: true}),
      captured: keyOf({onKeyDownCapture: true})
    }
  },
  keyPress: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyPress: true}),
      captured: keyOf({onKeyPressCapture: true})
    }
  },
  keyUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyUp: true}),
      captured: keyOf({onKeyUpCapture: true})
    }
  },
  load: {
    phasedRegistrationNames: {
      bubbled: keyOf({onLoad: true}),
      captured: keyOf({onLoadCapture: true})
    }
  },
  error: {
    phasedRegistrationNames: {
      bubbled: keyOf({onError: true}),
      captured: keyOf({onErrorCapture: true})
    }
  },
  // Note: We do not allow listening to mouseOver events. Instead, use the
  // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
  mouseDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseDown: true}),
      captured: keyOf({onMouseDownCapture: true})
    }
  },
  mouseMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseMove: true}),
      captured: keyOf({onMouseMoveCapture: true})
    }
  },
  mouseOut: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOut: true}),
      captured: keyOf({onMouseOutCapture: true})
    }
  },
  mouseOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseOver: true}),
      captured: keyOf({onMouseOverCapture: true})
    }
  },
  mouseUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseUp: true}),
      captured: keyOf({onMouseUpCapture: true})
    }
  },
  paste: {
    phasedRegistrationNames: {
      bubbled: keyOf({onPaste: true}),
      captured: keyOf({onPasteCapture: true})
    }
  },
  reset: {
    phasedRegistrationNames: {
      bubbled: keyOf({onReset: true}),
      captured: keyOf({onResetCapture: true})
    }
  },
  scroll: {
    phasedRegistrationNames: {
      bubbled: keyOf({onScroll: true}),
      captured: keyOf({onScrollCapture: true})
    }
  },
  submit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSubmit: true}),
      captured: keyOf({onSubmitCapture: true})
    }
  },
  touchCancel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchCancel: true}),
      captured: keyOf({onTouchCancelCapture: true})
    }
  },
  touchEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchEnd: true}),
      captured: keyOf({onTouchEndCapture: true})
    }
  },
  touchMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchMove: true}),
      captured: keyOf({onTouchMoveCapture: true})
    }
  },
  touchStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchStart: true}),
      captured: keyOf({onTouchStartCapture: true})
    }
  },
  wheel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onWheel: true}),
      captured: keyOf({onWheelCapture: true})
    }
  }
};

var topLevelEventsToDispatchConfig = {
  topBlur:        eventTypes.blur,
  topClick:       eventTypes.click,
  topContextMenu: eventTypes.contextMenu,
  topCopy:        eventTypes.copy,
  topCut:         eventTypes.cut,
  topDoubleClick: eventTypes.doubleClick,
  topDrag:        eventTypes.drag,
  topDragEnd:     eventTypes.dragEnd,
  topDragEnter:   eventTypes.dragEnter,
  topDragExit:    eventTypes.dragExit,
  topDragLeave:   eventTypes.dragLeave,
  topDragOver:    eventTypes.dragOver,
  topDragStart:   eventTypes.dragStart,
  topDrop:        eventTypes.drop,
  topError:       eventTypes.error,
  topFocus:       eventTypes.focus,
  topInput:       eventTypes.input,
  topKeyDown:     eventTypes.keyDown,
  topKeyPress:    eventTypes.keyPress,
  topKeyUp:       eventTypes.keyUp,
  topLoad:        eventTypes.load,
  topMouseDown:   eventTypes.mouseDown,
  topMouseMove:   eventTypes.mouseMove,
  topMouseOut:    eventTypes.mouseOut,
  topMouseOver:   eventTypes.mouseOver,
  topMouseUp:     eventTypes.mouseUp,
  topPaste:       eventTypes.paste,
  topReset:       eventTypes.reset,
  topScroll:      eventTypes.scroll,
  topSubmit:      eventTypes.submit,
  topTouchCancel: eventTypes.touchCancel,
  topTouchEnd:    eventTypes.touchEnd,
  topTouchMove:   eventTypes.touchMove,
  topTouchStart:  eventTypes.touchStart,
  topWheel:       eventTypes.wheel
};

for (var topLevelType in topLevelEventsToDispatchConfig) {
  topLevelEventsToDispatchConfig[topLevelType].dependencies = [topLevelType];
}

var SimpleEventPlugin = {

  eventTypes: eventTypes,

  /**
   * Same as the default implementation, except cancels the event when return
   * value is false.
   *
   * @param {object} Event to be dispatched.
   * @param {function} Application-level callback.
   * @param {string} domID DOM ID to pass to the callback.
   */
  executeDispatch: function(event, listener, domID) {
    var returnValue = EventPluginUtils.executeDispatch(event, listener, domID);
    if (returnValue === false) {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    var EventConstructor;
    switch (topLevelType) {
      case topLevelTypes.topInput:
      case topLevelTypes.topLoad:
      case topLevelTypes.topError:
      case topLevelTypes.topReset:
      case topLevelTypes.topSubmit:
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
      case topLevelTypes.topKeyDown:
      case topLevelTypes.topKeyPress:
      case topLevelTypes.topKeyUp:
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case topLevelTypes.topBlur:
      case topLevelTypes.topFocus:
        EventConstructor = SyntheticFocusEvent;
        break;
      case topLevelTypes.topClick:
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null;
        }
        /* falls through */
      case topLevelTypes.topContextMenu:
      case topLevelTypes.topDoubleClick:
      case topLevelTypes.topMouseDown:
      case topLevelTypes.topMouseMove:
      case topLevelTypes.topMouseOut:
      case topLevelTypes.topMouseOver:
      case topLevelTypes.topMouseUp:
        EventConstructor = SyntheticMouseEvent;
        break;
      case topLevelTypes.topDrag:
      case topLevelTypes.topDragEnd:
      case topLevelTypes.topDragEnter:
      case topLevelTypes.topDragExit:
      case topLevelTypes.topDragLeave:
      case topLevelTypes.topDragOver:
      case topLevelTypes.topDragStart:
      case topLevelTypes.topDrop:
        EventConstructor = SyntheticDragEvent;
        break;
      case topLevelTypes.topTouchCancel:
      case topLevelTypes.topTouchEnd:
      case topLevelTypes.topTouchMove:
      case topLevelTypes.topTouchStart:
        EventConstructor = SyntheticTouchEvent;
        break;
      case topLevelTypes.topScroll:
        EventConstructor = SyntheticUIEvent;
        break;
      case topLevelTypes.topWheel:
        EventConstructor = SyntheticWheelEvent;
        break;
      case topLevelTypes.topCopy:
      case topLevelTypes.topCut:
      case topLevelTypes.topPaste:
        EventConstructor = SyntheticClipboardEvent;
        break;
    }
    ("production" !== "development" ? invariant(
      EventConstructor,
      'SimpleEventPlugin: Unhandled event type, `%s`.',
      topLevelType
    ) : invariant(EventConstructor));
    var event = EventConstructor.getPooled(
      dispatchConfig,
      topLevelTargetID,
      nativeEvent
    );
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  }

};

module.exports = SimpleEventPlugin;

},{"./EventConstants":14,"./EventPluginUtils":18,"./EventPropagators":19,"./SyntheticClipboardEvent":74,"./SyntheticDragEvent":76,"./SyntheticEvent":77,"./SyntheticFocusEvent":78,"./SyntheticKeyboardEvent":79,"./SyntheticMouseEvent":80,"./SyntheticTouchEvent":81,"./SyntheticUIEvent":82,"./SyntheticWheelEvent":83,"./invariant":108,"./keyOf":115}],74:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticClipboardEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
var ClipboardEventInterface = {
  clipboardData: function(event) {
    return (
      'clipboardData' in event ?
        event.clipboardData :
        window.clipboardData
    );
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticClipboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface);

module.exports = SyntheticClipboardEvent;


},{"./SyntheticEvent":77}],75:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticCompositionEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#events-compositionevents
 */
var CompositionEventInterface = {
  data: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticCompositionEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(
  SyntheticCompositionEvent,
  CompositionEventInterface
);

module.exports = SyntheticCompositionEvent;


},{"./SyntheticEvent":77}],76:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticDragEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticMouseEvent = require("./SyntheticMouseEvent");

/**
 * @interface DragEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var DragEventInterface = {
  dataTransfer: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticDragEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticMouseEvent.augmentClass(SyntheticDragEvent, DragEventInterface);

module.exports = SyntheticDragEvent;

},{"./SyntheticMouseEvent":80}],77:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticEvent
 * @typechecks static-only
 */

"use strict";

var PooledClass = require("./PooledClass");

var emptyFunction = require("./emptyFunction");
var getEventTarget = require("./getEventTarget");
var merge = require("./merge");
var mergeInto = require("./mergeInto");

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var EventInterface = {
  type: null,
  target: getEventTarget,
  // currentTarget is set when dispatching; no use in copying it here
  currentTarget: emptyFunction.thatReturnsNull,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};

/**
 * Synthetic events are dispatched by event plugins, typically in response to a
 * top-level event delegation handler.
 *
 * These systems should generally use pooling to reduce the frequency of garbage
 * collection. The system should check `isPersistent` to determine whether the
 * event should be released into the pool after being dispatched. Users that
 * need a persisted event should invoke `persist`.
 *
 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
 * normalizing browser quirks. Subclasses do not necessarily have to implement a
 * DOM interface; custom application-specific events can also subclass this.
 *
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 */
function SyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  this.dispatchConfig = dispatchConfig;
  this.dispatchMarker = dispatchMarker;
  this.nativeEvent = nativeEvent;

  var Interface = this.constructor.Interface;
  for (var propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue;
    }
    var normalize = Interface[propName];
    if (normalize) {
      this[propName] = normalize(nativeEvent);
    } else {
      this[propName] = nativeEvent[propName];
    }
  }

  var defaultPrevented = nativeEvent.defaultPrevented != null ?
    nativeEvent.defaultPrevented :
    nativeEvent.returnValue === false;
  if (defaultPrevented) {
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  } else {
    this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
  }
  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
}

mergeInto(SyntheticEvent.prototype, {

  preventDefault: function() {
    this.defaultPrevented = true;
    var event = this.nativeEvent;
    event.preventDefault ? event.preventDefault() : event.returnValue = false;
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  },

  stopPropagation: function() {
    var event = this.nativeEvent;
    event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
    this.isPropagationStopped = emptyFunction.thatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: emptyFunction.thatReturnsFalse,

  /**
   * `PooledClass` looks for `destructor` on each instance it releases.
   */
  destructor: function() {
    var Interface = this.constructor.Interface;
    for (var propName in Interface) {
      this[propName] = null;
    }
    this.dispatchConfig = null;
    this.dispatchMarker = null;
    this.nativeEvent = null;
  }

});

SyntheticEvent.Interface = EventInterface;

/**
 * Helper to reduce boilerplate when creating subclasses.
 *
 * @param {function} Class
 * @param {?object} Interface
 */
SyntheticEvent.augmentClass = function(Class, Interface) {
  var Super = this;

  var prototype = Object.create(Super.prototype);
  mergeInto(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;

  Class.Interface = merge(Super.Interface, Interface);
  Class.augmentClass = Super.augmentClass;

  PooledClass.addPoolingTo(Class, PooledClass.threeArgumentPooler);
};

PooledClass.addPoolingTo(SyntheticEvent, PooledClass.threeArgumentPooler);

module.exports = SyntheticEvent;

},{"./PooledClass":23,"./emptyFunction":95,"./getEventTarget":101,"./merge":117,"./mergeInto":119}],78:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticFocusEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface FocusEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var FocusEventInterface = {
  relatedTarget: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticFocusEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticFocusEvent, FocusEventInterface);

module.exports = SyntheticFocusEvent;

},{"./SyntheticUIEvent":82}],79:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticKeyboardEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

var getEventKey = require("./getEventKey");

/**
 * @interface KeyboardEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var KeyboardEventInterface = {
  key: getEventKey,
  location: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  repeat: null,
  locale: null,
  // Legacy Interface
  'char': null,
  charCode: null,
  keyCode: null,
  which: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticKeyboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent, KeyboardEventInterface);

module.exports = SyntheticKeyboardEvent;

},{"./SyntheticUIEvent":82,"./getEventKey":100}],80:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticMouseEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");
var ViewportMetrics = require("./ViewportMetrics");

/**
 * @interface MouseEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var MouseEventInterface = {
  screenX: null,
  screenY: null,
  clientX: null,
  clientY: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  button: function(event) {
    // Webkit, Firefox, IE9+
    // which:  1 2 3
    // button: 0 1 2 (standard)
    var button = event.button;
    if ('which' in event) {
      return button;
    }
    // IE<9
    // which:  undefined
    // button: 0 0 0
    // button: 1 4 2 (onmouseup)
    return button === 2 ? 2 : button === 4 ? 1 : 0;
  },
  buttons: null,
  relatedTarget: function(event) {
    return event.relatedTarget || (
      event.fromElement === event.srcElement ?
        event.toElement :
        event.fromElement
    );
  },
  // "Proprietary" Interface.
  pageX: function(event) {
    return 'pageX' in event ?
      event.pageX :
      event.clientX + ViewportMetrics.currentScrollLeft;
  },
  pageY: function(event) {
    return 'pageY' in event ?
      event.pageY :
      event.clientY + ViewportMetrics.currentScrollTop;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticMouseEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticMouseEvent, MouseEventInterface);

module.exports = SyntheticMouseEvent;

},{"./SyntheticUIEvent":82,"./ViewportMetrics":85}],81:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticTouchEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/touch-events/
 */
var TouchEventInterface = {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

module.exports = SyntheticTouchEvent;

},{"./SyntheticUIEvent":82}],82:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticUIEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface UIEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var UIEventInterface = {
  view: null,
  detail: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticUIEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);

module.exports = SyntheticUIEvent;

},{"./SyntheticEvent":77}],83:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticWheelEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticMouseEvent = require("./SyntheticMouseEvent");

/**
 * @interface WheelEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var WheelEventInterface = {
  deltaX: function(event) {
    return (
      'deltaX' in event ? event.deltaX :
      // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
      'wheelDeltaX' in event ? -event.wheelDeltaX : 0
    );
  },
  deltaY: function(event) {
    return (
      'deltaY' in event ? event.deltaY :
      // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
      'wheelDeltaY' in event ? -event.wheelDeltaY :
      // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
      'wheelDelta' in event ? -event.wheelDelta : 0
    );
  },
  deltaZ: null,

  // Browsers without "deltaMode" is reporting in raw wheel delta where one
  // notch on the scroll is always +/- 120, roughly equivalent to pixels.
  // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
  // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
  deltaMode: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticMouseEvent}
 */
function SyntheticWheelEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticMouseEvent.augmentClass(SyntheticWheelEvent, WheelEventInterface);

module.exports = SyntheticWheelEvent;

},{"./SyntheticMouseEvent":80}],84:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule Transaction
 */

"use strict";

var invariant = require("./invariant");

/**
 * `Transaction` creates a black box that is able to wrap any method such that
 * certain invariants are maintained before and after the method is invoked
 * (Even if an exception is thrown while invoking the wrapped method). Whoever
 * instantiates a transaction can provide enforcers of the invariants at
 * creation time. The `Transaction` class itself will supply one additional
 * automatic invariant for you - the invariant that any transaction instance
 * should not be run while it is already being run. You would typically create a
 * single instance of a `Transaction` for reuse multiple times, that potentially
 * is used to wrap several different methods. Wrappers are extremely simple -
 * they only require implementing two methods.
 *
 * <pre>
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 * </pre>
 *
 * Bonus:
 * - Reports timing metrics by method name and wrapper index.
 *
 * Use cases:
 * - Preserving the input selection ranges before/after reconciliation.
 *   Restoring selection even in the event of an unexpected error.
 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
 *   while guaranteeing that afterwards, the event system is reactivated.
 * - Flushing a queue of collected DOM mutations to the main UI thread after a
 *   reconciliation takes place in a worker thread.
 * - Invoking any collected `componentDidUpdate` callbacks after rendering new
 *   content.
 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
 * - (Future use case): Layout calculations before and after DOM upates.
 *
 * Transactional plugin API:
 * - A module that has an `initialize` method that returns any precomputation.
 * - and a `close` method that accepts the precomputation. `close` is invoked
 *   when the wrapped process is completed, or has failed.
 *
 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
 * that implement `initialize` and `close`.
 * @return {Transaction} Single transaction for reuse in thread.
 *
 * @class Transaction
 */
var Mixin = {
  /**
   * Sets up this instance so that it is prepared for collecting metrics. Does
   * so such that this setup method may be used on an instance that is already
   * initialized, in a way that does not consume additional memory upon reuse.
   * That can be useful if you decide to make your subclass of this mixin a
   * "PooledClass".
   */
  reinitializeTransaction: function() {
    this.transactionWrappers = this.getTransactionWrappers();
    if (!this.wrapperInitData) {
      this.wrapperInitData = [];
    } else {
      this.wrapperInitData.length = 0;
    }
    if (!this.timingMetrics) {
      this.timingMetrics = {};
    }
    this.timingMetrics.methodInvocationTime = 0;
    if (!this.timingMetrics.wrapperInitTimes) {
      this.timingMetrics.wrapperInitTimes = [];
    } else {
      this.timingMetrics.wrapperInitTimes.length = 0;
    }
    if (!this.timingMetrics.wrapperCloseTimes) {
      this.timingMetrics.wrapperCloseTimes = [];
    } else {
      this.timingMetrics.wrapperCloseTimes.length = 0;
    }
    this._isInTransaction = false;
  },

  _isInTransaction: false,

  /**
   * @abstract
   * @return {Array<TransactionWrapper>} Array of transaction wrappers.
   */
  getTransactionWrappers: null,

  isInTransaction: function() {
    return !!this._isInTransaction;
  },

  /**
   * Executes the function within a safety window. Use this for the top level
   * methods that result in large amounts of computation/mutations that would
   * need to be safety checked.
   *
   * @param {function} method Member of scope to call.
   * @param {Object} scope Scope to invoke from.
   * @param {Object?=} args... Arguments to pass to the method (optional).
   *                           Helps prevent need to bind in many cases.
   * @return Return value from `method`.
   */
  perform: function(method, scope, a, b, c, d, e, f) {
    ("production" !== "development" ? invariant(
      !this.isInTransaction(),
      'Transaction.perform(...): Cannot initialize a transaction when there ' +
      'is already an outstanding transaction.'
    ) : invariant(!this.isInTransaction()));
    var memberStart = Date.now();
    var errorThrown;
    var ret;
    try {
      this._isInTransaction = true;
      // Catching errors makes debugging more difficult, so we start with
      // errorThrown set to true before setting it to false after calling
      // close -- if it's still set to true in the finally block, it means
      // one of these calls threw.
      errorThrown = true;
      this.initializeAll(0);
      ret = method.call(scope, a, b, c, d, e, f);
      errorThrown = false;
    } finally {
      var memberEnd = Date.now();
      this.methodInvocationTime += (memberEnd - memberStart);
      try {
        if (errorThrown) {
          // If `method` throws, prefer to show that stack trace over any thrown
          // by invoking `closeAll`.
          try {
            this.closeAll(0);
          } catch (err) {
          }
        } else {
          // Since `method` didn't throw, we don't want to silence the exception
          // here.
          this.closeAll(0);
        }
      } finally {
        this._isInTransaction = false;
      }
    }
    return ret;
  },

  initializeAll: function(startIndex) {
    var transactionWrappers = this.transactionWrappers;
    var wrapperInitTimes = this.timingMetrics.wrapperInitTimes;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var initStart = Date.now();
      var wrapper = transactionWrappers[i];
      try {
        // Catching errors makes debugging more difficult, so we start with the
        // OBSERVED_ERROR state before overwriting it with the real return value
        // of initialize -- if it's still set to OBSERVED_ERROR in the finally
        // block, it means wrapper.initialize threw.
        this.wrapperInitData[i] = Transaction.OBSERVED_ERROR;
        this.wrapperInitData[i] = wrapper.initialize ?
          wrapper.initialize.call(this) :
          null;
      } finally {
        var curInitTime = wrapperInitTimes[i];
        var initEnd = Date.now();
        wrapperInitTimes[i] = (curInitTime || 0) + (initEnd - initStart);

        if (this.wrapperInitData[i] === Transaction.OBSERVED_ERROR) {
          // The initializer for wrapper i threw an error; initialize the
          // remaining wrappers but silence any exceptions from them to ensure
          // that the first error is the one to bubble up.
          try {
            this.initializeAll(i + 1);
          } catch (err) {
          }
        }
      }
    }
  },

  /**
   * Invokes each of `this.transactionWrappers.close[i]` functions, passing into
   * them the respective return values of `this.transactionWrappers.init[i]`
   * (`close`rs that correspond to initializers that failed will not be
   * invoked).
   */
  closeAll: function(startIndex) {
    ("production" !== "development" ? invariant(
      this.isInTransaction(),
      'Transaction.closeAll(): Cannot close transaction when none are open.'
    ) : invariant(this.isInTransaction()));
    var transactionWrappers = this.transactionWrappers;
    var wrapperCloseTimes = this.timingMetrics.wrapperCloseTimes;
    for (var i = startIndex; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      var closeStart = Date.now();
      var initData = this.wrapperInitData[i];
      var errorThrown;
      try {
        // Catching errors makes debugging more difficult, so we start with
        // errorThrown set to true before setting it to false after calling
        // close -- if it's still set to true in the finally block, it means
        // wrapper.close threw.
        errorThrown = true;
        if (initData !== Transaction.OBSERVED_ERROR) {
          wrapper.close && wrapper.close.call(this, initData);
        }
        errorThrown = false;
      } finally {
        var closeEnd = Date.now();
        var curCloseTime = wrapperCloseTimes[i];
        wrapperCloseTimes[i] = (curCloseTime || 0) + (closeEnd - closeStart);

        if (errorThrown) {
          // The closer for wrapper i threw an error; close the remaining
          // wrappers but silence any exceptions from them to ensure that the
          // first error is the one to bubble up.
          try {
            this.closeAll(i + 1);
          } catch (e) {
          }
        }
      }
    }
    this.wrapperInitData.length = 0;
  }
};

var Transaction = {

  Mixin: Mixin,

  /**
   * Token to look for to determine if an error occured.
   */
  OBSERVED_ERROR: {}

};

module.exports = Transaction;

},{"./invariant":108}],85:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ViewportMetrics
 */

"use strict";

var getUnboundedScrollPosition = require("./getUnboundedScrollPosition");

var ViewportMetrics = {

  currentScrollLeft: 0,

  currentScrollTop: 0,

  refreshScrollValues: function() {
    var scrollPosition = getUnboundedScrollPosition(window);
    ViewportMetrics.currentScrollLeft = scrollPosition.x;
    ViewportMetrics.currentScrollTop = scrollPosition.y;
  }

};

module.exports = ViewportMetrics;

},{"./getUnboundedScrollPosition":106}],86:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule accumulate
 */

"use strict";

var invariant = require("./invariant");

/**
 * Accumulates items that must not be null or undefined.
 *
 * This is used to conserve memory by avoiding array allocations.
 *
 * @return {*|array<*>} An accumulation of items.
 */
function accumulate(current, next) {
  ("production" !== "development" ? invariant(
    next != null,
    'accumulate(...): Accumulated items must be not be null or undefined.'
  ) : invariant(next != null));
  if (current == null) {
    return next;
  } else {
    // Both are not empty. Warning: Never call x.concat(y) when you are not
    // certain that x is an Array (x could be a string with concat method).
    var currentIsArray = Array.isArray(current);
    var nextIsArray = Array.isArray(next);
    if (currentIsArray) {
      return current.concat(next);
    } else {
      if (nextIsArray) {
        return [current].concat(next);
      } else {
        return [current, next];
      }
    }
  }
}

module.exports = accumulate;

},{"./invariant":108}],87:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule adler32
 */

/* jslint bitwise:true */

"use strict";

var MOD = 65521;

// This is a clean-room implementation of adler32 designed for detecting
// if markup is not what we expect it to be. It does not need to be
// cryptographically strong, only reasonable good at detecting if markup
// generated on the server is different than that on the client.
function adler32(data) {
  var a = 1;
  var b = 0;
  for (var i = 0; i < data.length; i++) {
    a = (a + data.charCodeAt(i)) % MOD;
    b = (b + a) % MOD;
  }
  return a | (b << 16);
}

module.exports = adler32;

},{}],88:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule containsNode
 * @typechecks
 */

var isTextNode = require("./isTextNode");

/*jslint bitwise:true */

/**
 * Checks if a given DOM node contains or is another DOM node.
 *
 * @param {?DOMNode} outerNode Outer DOM node.
 * @param {?DOMNode} innerNode Inner DOM node.
 * @return {boolean} True if `outerNode` contains or is `innerNode`.
 */
function containsNode(outerNode, innerNode) {
  if (!outerNode || !innerNode) {
    return false;
  } else if (outerNode === innerNode) {
    return true;
  } else if (isTextNode(outerNode)) {
    return false;
  } else if (isTextNode(innerNode)) {
    return containsNode(outerNode, innerNode.parentNode);
  } else if (outerNode.contains) {
    return outerNode.contains(innerNode);
  } else if (outerNode.compareDocumentPosition) {
    return !!(outerNode.compareDocumentPosition(innerNode) & 16);
  } else {
    return false;
  }
}

module.exports = containsNode;

},{"./isTextNode":112}],89:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule copyProperties
 */

/**
 * Copy properties from one or more objects (up to 5) into the first object.
 * This is a shallow copy. It mutates the first object and also returns it.
 *
 * NOTE: `arguments` has a very significant performance penalty, which is why
 * we don't support unlimited arguments.
 */
function copyProperties(obj, a, b, c, d, e, f) {
  obj = obj || {};

  if ("production" !== "development") {
    if (f) {
      throw new Error('Too many arguments passed to copyProperties');
    }
  }

  var args = [a, b, c, d, e];
  var ii = 0, v;
  while (args[ii]) {
    v = args[ii++];
    for (var k in v) {
      obj[k] = v[k];
    }

    // IE ignores toString in object iteration.. See:
    // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
    if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
        (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
      obj.toString = v.toString;
    }
  }

  return obj;
}

module.exports = copyProperties;

},{}],90:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createArrayFrom
 * @typechecks
 */

var toArray = require("./toArray");

/**
 * Perform a heuristic test to determine if an object is "array-like".
 *
 *   A monk asked Joshu, a Zen master, "Has a dog Buddha nature?"
 *   Joshu replied: "Mu."
 *
 * This function determines if its argument has "array nature": it returns
 * true if the argument is an actual array, an `arguments' object, or an
 * HTMLCollection (e.g. node.childNodes or node.getElementsByTagName()).
 *
 * It will return false for other array-like objects like Filelist.
 *
 * @param {*} obj
 * @return {boolean}
 */
function hasArrayNature(obj) {
  return (
    // not null/false
    !!obj &&
    // arrays are objects, NodeLists are functions in Safari
    (typeof obj == 'object' || typeof obj == 'function') &&
    // quacks like an array
    ('length' in obj) &&
    // not window
    !('setInterval' in obj) &&
    // no DOM node should be considered an array-like
    // a 'select' element has 'length' and 'item' properties on IE8
    (typeof obj.nodeType != 'number') &&
    (
      // a real array
      (// HTMLCollection/NodeList
      (Array.isArray(obj) ||
      // arguments
      ('callee' in obj) || 'item' in obj))
    )
  );
}

/**
 * Ensure that the argument is an array by wrapping it in an array if it is not.
 * Creates a copy of the argument if it is already an array.
 *
 * This is mostly useful idiomatically:
 *
 *   var createArrayFrom = require('createArrayFrom');
 *
 *   function takesOneOrMoreThings(things) {
 *     things = createArrayFrom(things);
 *     ...
 *   }
 *
 * This allows you to treat `things' as an array, but accept scalars in the API.
 *
 * If you need to convert an array-like object, like `arguments`, into an array
 * use toArray instead.
 *
 * @param {*} obj
 * @return {array}
 */
function createArrayFrom(obj) {
  if (!hasArrayNature(obj)) {
    return [obj];
  } else if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return toArray(obj);
  }
}

module.exports = createArrayFrom;

},{"./toArray":127}],91:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createFullPageComponent
 * @typechecks
 */

"use strict";

// Defeat circular references by requiring this directly.
var ReactCompositeComponent = require("./ReactCompositeComponent");

var invariant = require("./invariant");

/**
 * Create a component that will throw an exception when unmounted.
 *
 * Components like <html> <head> and <body> can't be removed or added
 * easily in a cross-browser way, however it's valuable to be able to
 * take advantage of React's reconciliation for styling and <title>
 * management. So we just document it and throw in dangerous cases.
 *
 * @param {function} componentClass convenience constructor to wrap
 * @return {function} convenience constructor of new component
 */
function createFullPageComponent(componentClass) {
  var FullPageComponent = ReactCompositeComponent.createClass({
    displayName: 'ReactFullPageComponent' + (
      componentClass.componentConstructor.displayName || ''
    ),

    componentWillUnmount: function() {
      ("production" !== "development" ? invariant(
        false,
        '%s tried to unmount. Because of cross-browser quirks it is ' +
        'impossible to unmount some top-level components (eg <html>, <head>, ' +
        'and <body>) reliably and efficiently. To fix this, have a single ' +
        'top-level component that never unmounts render these elements.',
        this.constructor.displayName
      ) : invariant(false));
    },

    render: function() {
      return this.transferPropsTo(componentClass(null, this.props.children));
    }
  });

  return FullPageComponent;
}

module.exports = createFullPageComponent;

},{"./ReactCompositeComponent":29,"./invariant":108}],92:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createNodesFromMarkup
 * @typechecks
 */

/*jslint evil: true, sub: true */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createArrayFrom = require("./createArrayFrom");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

/**
 * Dummy container used to render all markup.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Pattern used by `getNodeName`.
 */
var nodeNamePattern = /^\s*<(\w+)/;

/**
 * Extracts the `nodeName` of the first element in a string of markup.
 *
 * @param {string} markup String of markup.
 * @return {?string} Node name of the supplied markup.
 */
function getNodeName(markup) {
  var nodeNameMatch = markup.match(nodeNamePattern);
  return nodeNameMatch && nodeNameMatch[1].toLowerCase();
}

/**
 * Creates an array containing the nodes rendered from the supplied markup. The
 * optionally supplied `handleScript` function will be invoked once for each
 * <script> element that is rendered. If no `handleScript` function is supplied,
 * an exception is thrown if any <script> elements are rendered.
 *
 * @param {string} markup A string of valid HTML markup.
 * @param {?function} handleScript Invoked once for each rendered <script>.
 * @return {array<DOMElement|DOMTextNode>} An array of rendered nodes.
 */
function createNodesFromMarkup(markup, handleScript) {
  var node = dummyNode;
  ("production" !== "development" ? invariant(!!dummyNode, 'createNodesFromMarkup dummy not initialized') : invariant(!!dummyNode));
  var nodeName = getNodeName(markup);

  var wrap = nodeName && getMarkupWrap(nodeName);
  if (wrap) {
    node.innerHTML = wrap[1] + markup + wrap[2];

    var wrapDepth = wrap[0];
    while (wrapDepth--) {
      node = node.lastChild;
    }
  } else {
    node.innerHTML = markup;
  }

  var scripts = node.getElementsByTagName('script');
  if (scripts.length) {
    ("production" !== "development" ? invariant(
      handleScript,
      'createNodesFromMarkup(...): Unexpected <script> element rendered.'
    ) : invariant(handleScript));
    createArrayFrom(scripts).forEach(handleScript);
  }

  var nodes = createArrayFrom(node.childNodes);
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
  return nodes;
}

module.exports = createNodesFromMarkup;

},{"./ExecutionEnvironment":20,"./createArrayFrom":90,"./getMarkupWrap":102,"./invariant":108}],93:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createObjectFrom
 */

/**
 * Construct an object from an array of keys
 * and optionally specified value or list of values.
 *
 *  >>> createObjectFrom(['a','b','c']);
 *  {a: true, b: true, c: true}
 *
 *  >>> createObjectFrom(['a','b','c'], false);
 *  {a: false, b: false, c: false}
 *
 *  >>> createObjectFrom(['a','b','c'], 'monkey');
 *  {c:'monkey', b:'monkey' c:'monkey'}
 *
 *  >>> createObjectFrom(['a','b','c'], [1,2,3]);
 *  {a: 1, b: 2, c: 3}
 *
 *  >>> createObjectFrom(['women', 'men'], [true, false]);
 *  {women: true, men: false}
 *
 * @param   Array   list of keys
 * @param   mixed   optional value or value array.  defaults true.
 * @returns object
 */
function createObjectFrom(keys, values /* = true */) {
  if ("production" !== "development") {
    if (!Array.isArray(keys)) {
      throw new TypeError('Must pass an array of keys.');
    }
  }

  var object = {};
  var isArray = Array.isArray(values);
  if (typeof values == 'undefined') {
    values = true;
  }

  for (var ii = keys.length; ii--;) {
    object[keys[ii]] = isArray ? values[ii] : values;
  }
  return object;
}

module.exports = createObjectFrom;

},{}],94:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule dangerousStyleValue
 * @typechecks static-only
 */

"use strict";

var CSSProperty = require("./CSSProperty");

/**
 * Convert a value into the proper css writable value. The `styleName` name
 * name should be logical (no hyphens), as specified
 * in `CSSProperty.isUnitlessNumber`.
 *
 * @param {string} styleName CSS property name such as `topMargin`.
 * @param {*} value CSS property value such as `10px`.
 * @return {string} Normalized style value with dimensions applied.
 */
function dangerousStyleValue(styleName, value) {
  // Note that we've removed escapeTextForBrowser() calls here since the
  // whole string will be escaped when the attribute is injected into
  // the markup. If you provide unsafe user data here they can inject
  // arbitrary CSS which may be problematic (I couldn't repro this):
  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
  // This is not an XSS hole but instead a potential CSS injection issue
  // which has lead to a greater discussion about how we're going to
  // trust URLs moving forward. See #2115901

  var isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  var isNonNumeric = isNaN(value);
  if (isNonNumeric || value === 0 || CSSProperty.isUnitlessNumber[styleName]) {
    return '' + value; // cast to string
  }

  return value + 'px';
}

module.exports = dangerousStyleValue;

},{"./CSSProperty":2}],95:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule emptyFunction
 */

var copyProperties = require("./copyProperties");

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

copyProperties(emptyFunction, {
  thatReturns: makeEmptyFunction,
  thatReturnsFalse: makeEmptyFunction(false),
  thatReturnsTrue: makeEmptyFunction(true),
  thatReturnsNull: makeEmptyFunction(null),
  thatReturnsThis: function() { return this; },
  thatReturnsArgument: function(arg) { return arg; }
});

module.exports = emptyFunction;

},{"./copyProperties":89}],96:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule escapeTextForBrowser
 * @typechecks static-only
 */

"use strict";

var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "/": "&#x2f;"
};

var ESCAPE_REGEX = /[&><"'\/]/g;

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escapeTextForBrowser(text) {
  return ('' + text).replace(ESCAPE_REGEX, escaper);
}

module.exports = escapeTextForBrowser;

},{}],97:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule flattenChildren
 */

"use strict";

var invariant = require("./invariant");
var traverseAllChildren = require("./traverseAllChildren");

/**
 * @param {function} traverseContext Context passed through traversal.
 * @param {?ReactComponent} child React child component.
 * @param {!string} name String name of key path to child.
 */
function flattenSingleChildIntoContext(traverseContext, child, name) {
  // We found a component instance.
  var result = traverseContext;
  ("production" !== "development" ? invariant(
    !result.hasOwnProperty(name),
    'flattenChildren(...): Encountered two children with the same key, `%s`. ' +
    'Children keys must be unique.',
    name
  ) : invariant(!result.hasOwnProperty(name)));
  if (child != null) {
    result[name] = child;
  }
}

/**
 * Flattens children that are typically specified as `props.children`. Any null
 * children will not be included in the resulting object.
 * @return {!object} flattened children keyed by name.
 */
function flattenChildren(children) {
  if (children == null) {
    return children;
  }
  var result = {};
  traverseAllChildren(children, flattenSingleChildIntoContext, result);
  return result;
}

module.exports = flattenChildren;

},{"./invariant":108,"./traverseAllChildren":128}],98:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule forEachAccumulated
 */

"use strict";

/**
 * @param {array} an "accumulation" of items which is either an Array or
 * a single item. Useful when paired with the `accumulate` module. This is a
 * simple utility that allows us to reason about a collection of items, but
 * handling the case when there is exactly one item (and we do not need to
 * allocate an array).
 */
var forEachAccumulated = function(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
};

module.exports = forEachAccumulated;

},{}],99:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getActiveElement
 * @typechecks
 */

/**
 * Same as document.activeElement but wraps in a try-catch block. In IE it is
 * not safe to call document.activeElement if there is nothing focused.
 *
 * The activeElement will be null only if the document body is not yet defined.
 */
function getActiveElement() /*?DOMElement*/ {
  try {
    return document.activeElement || document.body;
  } catch (e) {
    return document.body;
  }
}

module.exports = getActiveElement;

},{}],100:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getEventKey
 * @typechecks static-only
 */

"use strict";

/**
 * Normalization of deprecated HTML5 "key" values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var normalizeKey = {
  'Esc': 'Escape',
  'Spacebar': ' ',
  'Left': 'ArrowLeft',
  'Up': 'ArrowUp',
  'Right': 'ArrowRight',
  'Down': 'ArrowDown',
  'Del': 'Delete',
  'Win': 'OS',
  'Menu': 'ContextMenu',
  'Apps': 'ContextMenu',
  'Scroll': 'ScrollLock',
  'MozPrintableKey': 'Unidentified'
};

/**
 * Translation from legacy "which/keyCode" to HTML5 "key"
 * Only special keys supported, all others depend on keyboard layout or browser
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
 */
var translateToKey = {
  8: 'Backspace',
  9: 'Tab',
  12: 'Clear',
  13: 'Enter',
  16: 'Shift',
  17: 'Control',
  18: 'Alt',
  19: 'Pause',
  20: 'CapsLock',
  27: 'Escape',
  32: ' ',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  45: 'Insert',
  46: 'Delete',
  112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6',
  118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
  144: 'NumLock',
  145: 'ScrollLock',
  224: 'Meta'
};

/**
 * @param {object} nativeEvent Native browser event.
 * @return {string} Normalized `key` property.
 */
function getEventKey(nativeEvent) {
  return 'key' in nativeEvent ?
    normalizeKey[nativeEvent.key] || nativeEvent.key :
    translateToKey[nativeEvent.which || nativeEvent.keyCode] || 'Unidentified';
}

module.exports = getEventKey;

},{}],101:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getEventTarget
 * @typechecks static-only
 */

"use strict";

/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
function getEventTarget(nativeEvent) {
  var target = nativeEvent.target || nativeEvent.srcElement || window;
  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === 3 ? target.parentNode : target;
}

module.exports = getEventTarget;

},{}],102:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getMarkupWrap
 */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var invariant = require("./invariant");

/**
 * Dummy container used to detect which wraps are necessary.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 *
 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
 */
var shouldWrap = {
  // Force wrapping for SVG elements because if they get created inside a <div>,
  // they will be initialized in the wrong namespace (and will not display).
  'circle': true,
  'defs': true,
  'g': true,
  'line': true,
  'linearGradient': true,
  'path': true,
  'polygon': true,
  'polyline': true,
  'radialGradient': true,
  'rect': true,
  'stop': true,
  'text': true
};

var selectWrap = [1, '<select multiple="true">', '</select>'];
var tableWrap = [1, '<table>', '</table>'];
var trWrap = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

var svgWrap = [1, '<svg>', '</svg>'];

var markupWrap = {
  '*': [1, '?<div>', '</div>'],

  'area': [1, '<map>', '</map>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'param': [1, '<object>', '</object>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],

  'optgroup': selectWrap,
  'option': selectWrap,

  'caption': tableWrap,
  'colgroup': tableWrap,
  'tbody': tableWrap,
  'tfoot': tableWrap,
  'thead': tableWrap,

  'td': trWrap,
  'th': trWrap,

  'circle': svgWrap,
  'defs': svgWrap,
  'g': svgWrap,
  'line': svgWrap,
  'linearGradient': svgWrap,
  'path': svgWrap,
  'polygon': svgWrap,
  'polyline': svgWrap,
  'radialGradient': svgWrap,
  'rect': svgWrap,
  'stop': svgWrap,
  'text': svgWrap
};

/**
 * Gets the markup wrap configuration for the supplied `nodeName`.
 *
 * NOTE: This lazily detects which wraps are necessary for the current browser.
 *
 * @param {string} nodeName Lowercase `nodeName`.
 * @return {?array} Markup wrap configuration, if applicable.
 */
function getMarkupWrap(nodeName) {
  ("production" !== "development" ? invariant(!!dummyNode, 'Markup wrapping node not initialized') : invariant(!!dummyNode));
  if (!markupWrap.hasOwnProperty(nodeName)) {
    nodeName = '*';
  }
  if (!shouldWrap.hasOwnProperty(nodeName)) {
    if (nodeName === '*') {
      dummyNode.innerHTML = '<link />';
    } else {
      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    }
    shouldWrap[nodeName] = !dummyNode.firstChild;
  }
  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
}


module.exports = getMarkupWrap;

},{"./ExecutionEnvironment":20,"./invariant":108}],103:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getNodeForCharacterOffset
 */

"use strict";

/**
 * Given any node return the first leaf node without children.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {DOMElement|DOMTextNode}
 */
function getLeafNode(node) {
  while (node && node.firstChild) {
    node = node.firstChild;
  }
  return node;
}

/**
 * Get the next sibling within a container. This will walk up the
 * DOM if a node's siblings have been exhausted.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {?DOMElement|DOMTextNode}
 */
function getSiblingNode(node) {
  while (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    }
    node = node.parentNode;
  }
}

/**
 * Get object describing the nodes which contain characters at offset.
 *
 * @param {DOMElement|DOMTextNode} root
 * @param {number} offset
 * @return {?object}
 */
function getNodeForCharacterOffset(root, offset) {
  var node = getLeafNode(root);
  var nodeStart = 0;
  var nodeEnd = 0;

  while (node) {
    if (node.nodeType == 3) {
      nodeEnd = nodeStart + node.textContent.length;

      if (nodeStart <= offset && nodeEnd >= offset) {
        return {
          node: node,
          offset: offset - nodeStart
        };
      }

      nodeStart = nodeEnd;
    }

    node = getLeafNode(getSiblingNode(node));
  }
}

module.exports = getNodeForCharacterOffset;

},{}],104:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getReactRootElementInContainer
 */

"use strict";

var DOC_NODE_TYPE = 9;

/**
 * @param {DOMElement|DOMDocument} container DOM element that may contain
 *                                           a React component
 * @return {?*} DOM element that may have the reactRoot ID, or null.
 */
function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOC_NODE_TYPE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

module.exports = getReactRootElementInContainer;

},{}],105:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getTextContentAccessor
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var contentKey = null;

/**
 * Gets the key used to access text content on a DOM node.
 *
 * @return {?string} Key used to access text content.
 * @internal
 */
function getTextContentAccessor() {
  if (!contentKey && ExecutionEnvironment.canUseDOM) {
    // Prefer textContent to innerText because many browsers support both but
    // SVG <text> elements don't support innerText even when <div> does.
    contentKey = 'textContent' in document.createElement('div') ?
      'textContent' :
      'innerText';
  }
  return contentKey;
}

module.exports = getTextContentAccessor;

},{"./ExecutionEnvironment":20}],106:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getUnboundedScrollPosition
 * @typechecks
 */

"use strict";

/**
 * Gets the scroll position of the supplied element or window.
 *
 * The return values are unbounded, unlike `getScrollPosition`. This means they
 * may be negative or exceed the element boundaries (which is possible using
 * inertial scrolling).
 *
 * @param {DOMWindow|DOMElement} scrollable
 * @return {object} Map with `x` and `y` keys.
 */
function getUnboundedScrollPosition(scrollable) {
  if (scrollable === window) {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }
  return {
    x: scrollable.scrollLeft,
    y: scrollable.scrollTop
  };
}

module.exports = getUnboundedScrollPosition;

},{}],107:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule hyphenate
 * @typechecks
 */

var _uppercasePattern = /([A-Z])/g;

/**
 * Hyphenates a camelcased string, for example:
 *
 *   > hyphenate('backgroundColor')
 *   < "background-color"
 *
 * @param {string} string
 * @return {string}
 */
function hyphenate(string) {
  return string.replace(_uppercasePattern, '-$1').toLowerCase();
}

module.exports = hyphenate;

},{}],108:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition) {
  if (!condition) {
    var error = new Error(
      'Minified exception occured; use the non-minified dev environment for ' +
      'the full error message and additional helpful warnings.'
    );
    error.framesToPop = 1;
    throw error;
  }
};

if ("production" !== "development") {
  invariant = function(condition, format, a, b, c, d, e, f) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }

    if (!condition) {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      var error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.framesToPop = 1; // we don't care about invariant's own frame
      throw error;
    }
  };
}

module.exports = invariant;

},{}],109:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isEventSupported
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var useHasFeature;
if (ExecutionEnvironment.canUseDOM) {
  useHasFeature =
    document.implementation &&
    document.implementation.hasFeature &&
    // always returns true in newer browsers as per the standard.
    // @see http://dom.spec.whatwg.org/#dom-domimplementation-hasfeature
    document.implementation.hasFeature('', '') !== true;
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @param {?boolean} capture Check if the capture phase is supported.
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix, capture) {
  if (!ExecutionEnvironment.canUseDOM ||
      capture && !('addEventListener' in document)) {
    return false;
  }

  var eventName = 'on' + eventNameSuffix;
  var isSupported = eventName in document;

  if (!isSupported) {
    var element = document.createElement('div');
    element.setAttribute(eventName, 'return;');
    isSupported = typeof element[eventName] === 'function';
  }

  if (!isSupported && useHasFeature && eventNameSuffix === 'wheel') {
    // This is the only way to test support for the `wheel` event in IE9+.
    isSupported = document.implementation.hasFeature('Events.wheel', '3.0');
  }

  return isSupported;
}

module.exports = isEventSupported;

},{"./ExecutionEnvironment":20}],110:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isNode
 * @typechecks
 */

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM node.
 */
function isNode(object) {
  return !!(object && (
    typeof Node !== 'undefined' ? object instanceof Node :
      typeof object === 'object' &&
      typeof object.nodeType === 'number' &&
      typeof object.nodeName === 'string'
  ));
}

module.exports = isNode;

},{}],111:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isTextInputElement
 */

"use strict";

/**
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
 */
var supportedInputTypes = {
  'color': true,
  'date': true,
  'datetime': true,
  'datetime-local': true,
  'email': true,
  'month': true,
  'number': true,
  'password': true,
  'range': true,
  'search': true,
  'tel': true,
  'text': true,
  'time': true,
  'url': true,
  'week': true
};

function isTextInputElement(elem) {
  return elem && (
    (elem.nodeName === 'INPUT' && supportedInputTypes[elem.type]) ||
    elem.nodeName === 'TEXTAREA'
  );
}

module.exports = isTextInputElement;

},{}],112:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isTextNode
 * @typechecks
 */

var isNode = require("./isNode");

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM text node.
 */
function isTextNode(object) {
  return isNode(object) && object.nodeType == 3;
}

module.exports = isTextNode;

},{"./isNode":110}],113:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule joinClasses
 * @typechecks static-only
 */

"use strict";

/**
 * Combines multiple className strings into one.
 * http://jsperf.com/joinclasses-args-vs-array
 *
 * @param {...?string} classes
 * @return {string}
 */
function joinClasses(className/*, ... */) {
  if (!className) {
    className = '';
  }
  var nextClass;
  var argLength = arguments.length;
  if (argLength > 1) {
    for (var ii = 1; ii < argLength; ii++) {
      nextClass = arguments[ii];
      nextClass && (className += ' ' + nextClass);
    }
  }
  return className;
}

module.exports = joinClasses;

},{}],114:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  ("production" !== "development" ? invariant(
    obj instanceof Object && !Array.isArray(obj),
    'keyMirror(...): Argument must be an object.'
  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{"./invariant":108}],115:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],116:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule memoizeStringOnly
 * @typechecks static-only
 */

"use strict";

/**
 * Memoizes the return value of a function that accepts one string argument.
 *
 * @param {function} callback
 * @return {function}
 */
function memoizeStringOnly(callback) {
  var cache = {};
  return function(string) {
    if (cache.hasOwnProperty(string)) {
      return cache[string];
    } else {
      return cache[string] = callback.call(this, string);
    }
  };
}

module.exports = memoizeStringOnly;

},{}],117:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule merge
 */

"use strict";

var mergeInto = require("./mergeInto");

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
var merge = function(one, two) {
  var result = {};
  mergeInto(result, one);
  mergeInto(result, two);
  return result;
};

module.exports = merge;

},{"./mergeInto":119}],118:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeHelpers
 *
 * requiresPolyfills: Array.isArray
 */

"use strict";

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");

/**
 * Maximum number of levels to traverse. Will catch circular structures.
 * @const
 */
var MAX_MERGE_DEPTH = 36;

/**
 * We won't worry about edge cases like new String('x') or new Boolean(true).
 * Functions are considered terminals, and arrays are not.
 * @param {*} o The item/object/value to test.
 * @return {boolean} true iff the argument is a terminal.
 */
var isTerminal = function(o) {
  return typeof o !== 'object' || o === null;
};

var mergeHelpers = {

  MAX_MERGE_DEPTH: MAX_MERGE_DEPTH,

  isTerminal: isTerminal,

  /**
   * Converts null/undefined values into empty object.
   *
   * @param {?Object=} arg Argument to be normalized (nullable optional)
   * @return {!Object}
   */
  normalizeMergeArg: function(arg) {
    return arg === undefined || arg === null ? {} : arg;
  },

  /**
   * If merging Arrays, a merge strategy *must* be supplied. If not, it is
   * likely the caller's fault. If this function is ever called with anything
   * but `one` and `two` being `Array`s, it is the fault of the merge utilities.
   *
   * @param {*} one Array to merge into.
   * @param {*} two Array to merge from.
   */
  checkMergeArrayArgs: function(one, two) {
    ("production" !== "development" ? invariant(
      Array.isArray(one) && Array.isArray(two),
      'Tried to merge arrays, instead got %s and %s.',
      one,
      two
    ) : invariant(Array.isArray(one) && Array.isArray(two)));
  },

  /**
   * @param {*} one Object to merge into.
   * @param {*} two Object to merge from.
   */
  checkMergeObjectArgs: function(one, two) {
    mergeHelpers.checkMergeObjectArg(one);
    mergeHelpers.checkMergeObjectArg(two);
  },

  /**
   * @param {*} arg
   */
  checkMergeObjectArg: function(arg) {
    ("production" !== "development" ? invariant(
      !isTerminal(arg) && !Array.isArray(arg),
      'Tried to merge an object, instead got %s.',
      arg
    ) : invariant(!isTerminal(arg) && !Array.isArray(arg)));
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkMergeLevel: function(level) {
    ("production" !== "development" ? invariant(
      level < MAX_MERGE_DEPTH,
      'Maximum deep merge depth exceeded. You may be attempting to merge ' +
      'circular structures in an unsupported way.'
    ) : invariant(level < MAX_MERGE_DEPTH));
  },

  /**
   * Checks that the supplied merge strategy is valid.
   *
   * @param {string} Array merge strategy.
   */
  checkArrayStrategy: function(strategy) {
    ("production" !== "development" ? invariant(
      strategy === undefined || strategy in mergeHelpers.ArrayStrategies,
      'You must provide an array strategy to deep merge functions to ' +
      'instruct the deep merge how to resolve merging two arrays.'
    ) : invariant(strategy === undefined || strategy in mergeHelpers.ArrayStrategies));
  },

  /**
   * Set of possible behaviors of merge algorithms when encountering two Arrays
   * that must be merged together.
   * - `clobber`: The left `Array` is ignored.
   * - `indexByIndex`: The result is achieved by recursively deep merging at
   *   each index. (not yet supported.)
   */
  ArrayStrategies: keyMirror({
    Clobber: true,
    IndexByIndex: true
  })

};

module.exports = mergeHelpers;

},{"./invariant":108,"./keyMirror":114}],119:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeInto
 * @typechecks static-only
 */

"use strict";

var mergeHelpers = require("./mergeHelpers");

var checkMergeObjectArg = mergeHelpers.checkMergeObjectArg;

/**
 * Shallow merges two structures by mutating the first parameter.
 *
 * @param {object} one Object to be merged into.
 * @param {?object} two Optional object with properties to merge from.
 */
function mergeInto(one, two) {
  checkMergeObjectArg(one);
  if (two != null) {
    checkMergeObjectArg(two);
    for (var key in two) {
      if (!two.hasOwnProperty(key)) {
        continue;
      }
      one[key] = two[key];
    }
  }
}

module.exports = mergeInto;

},{"./mergeHelpers":118}],120:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mixInto
 */

"use strict";

/**
 * Simply copies properties to the prototype.
 */
var mixInto = function(constructor, methodBag) {
  var methodName;
  for (methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {
      continue;
    }
    constructor.prototype[methodName] = methodBag[methodName];
  }
};

module.exports = mixInto;

},{}],121:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule objMap
 */

"use strict";

/**
 * For each key/value pair, invokes callback func and constructs a resulting
 * object which contains, for every key in obj, values that are the result of
 * of invoking the function:
 *
 *   func(value, key, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of mapping or null if obj is falsey
 */
function objMap(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = func.call(context, obj[key], key, i++);
    }
  }
  return ret;
}

module.exports = objMap;

},{}],122:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule objMapKeyVal
 */

"use strict";

/**
 * Behaves the same as `objMap` but invokes func with the key first, and value
 * second. Use `objMap` unless you need this special case.
 * Invokes func as:
 *
 *   func(key, value, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {!function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of mapping or null if obj is falsey
 */
function objMapKeyVal(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = func.call(context, key, obj[key], i++);
    }
  }
  return ret;
}

module.exports = objMapKeyVal;

},{}],123:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule onlyChild
 */
"use strict";

var ReactComponent = require("./ReactComponent");

var invariant = require("./invariant");

/**
 * Returns the first child in a collection of children and verifies that there
 * is only one child in the collection. The current implementation of this
 * function assumes that a single child gets passed without a wrapper, but the
 * purpose of this helper function is to abstract away the particular structure
 * of children.
 *
 * @param {?object} children Child collection structure.
 * @return {ReactComponent} The first and only `ReactComponent` contained in the
 * structure.
 */
function onlyChild(children) {
  ("production" !== "development" ? invariant(
    ReactComponent.isValidComponent(children),
    'onlyChild must be passed a children with exactly one child.'
  ) : invariant(ReactComponent.isValidComponent(children)));
  return children;
}

module.exports = onlyChild;

},{"./ReactComponent":26,"./invariant":108}],124:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule performanceNow
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

/**
 * Detect if we can use window.performance.now() and gracefully
 * fallback to Date.now() if it doesn't exist.
 * We need to support Firefox < 15 for now due to Facebook's webdriver
 * infrastructure.
 */
var performance = null;

if (ExecutionEnvironment.canUseDOM) {
  performance = window.performance || window.webkitPerformance;
}

if (!performance || !performance.now) {
  performance = Date;
}

var performanceNow = performance.now.bind(performance);

module.exports = performanceNow;

},{"./ExecutionEnvironment":20}],125:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule shallowEqual
 */

"use strict";

/**
 * Performs equality by iterating through keys on an object and returning
 * false when any key has values which are not strictly equal between
 * objA and objB. Returns true when the values of all keys are strictly equal.
 *
 * @return {boolean}
 */
function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }
  var key;
  // Test for A's keys different from B.
  for (key in objA) {
    if (objA.hasOwnProperty(key) &&
        (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }
  // Test for B'a keys missing from A.
  for (key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

module.exports = shallowEqual;

},{}],126:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule shouldUpdateReactComponent
 * @typechecks static-only
 */

"use strict";

/**
 * Given a `prevComponent` and `nextComponent`, determines if `prevComponent`
 * should be updated as opposed to being destroyed or replaced.
 *
 * @param {?object} prevComponent
 * @param {?object} nextComponent
 * @return {boolean} True if `prevComponent` should be updated.
 * @protected
 */
function shouldUpdateReactComponent(prevComponent, nextComponent) {
  // TODO: Remove warning after a release.
  if (prevComponent && nextComponent &&
      prevComponent.constructor === nextComponent.constructor && (
        (prevComponent.props && prevComponent.props.key) ===
        (nextComponent.props && nextComponent.props.key)
      )) {
    if (prevComponent._owner === nextComponent._owner) {
      return true;
    } else {
      if ("production" !== "development") {
        if (prevComponent.state) {
          console.warn(
            'A recent change to React has been found to impact your code. ' +
            'A mounted component will now be unmounted and replaced by a ' +
            'component (of the same class) if their owners are different. ' +
            'Previously, ownership was not considered when updating.',
            prevComponent,
            nextComponent
          );
        }
      }
    }
  }
  return false;
}

module.exports = shouldUpdateReactComponent;

},{}],127:[function(require,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule toArray
 * @typechecks
 */

var invariant = require("./invariant");

/**
 * Convert array-like objects to arrays.
 *
 * This API assumes the caller knows the contents of the data type. For less
 * well defined inputs use createArrayFrom.
 *
 * @param {object|function} obj
 * @return {array}
 */
function toArray(obj) {
  var length = obj.length;

  // Some browse builtin objects can report typeof 'function' (e.g. NodeList in
  // old versions of Safari).
  ("production" !== "development" ? invariant(
    !Array.isArray(obj) &&
    (typeof obj === 'object' || typeof obj === 'function'),
    'toArray: Array-like object expected'
  ) : invariant(!Array.isArray(obj) &&
  (typeof obj === 'object' || typeof obj === 'function')));

  ("production" !== "development" ? invariant(
    typeof length === 'number',
    'toArray: Object needs a length property'
  ) : invariant(typeof length === 'number'));

  ("production" !== "development" ? invariant(
    length === 0 ||
    (length - 1) in obj,
    'toArray: Object should have keys for indices'
  ) : invariant(length === 0 ||
  (length - 1) in obj));

  // Old IE doesn't give collections access to hasOwnProperty. Assume inputs
  // without method will throw during the slice call and skip straight to the
  // fallback.
  if (obj.hasOwnProperty) {
    try {
      return Array.prototype.slice.call(obj);
    } catch (e) {
      // IE < 9 does not support Array#slice on collections objects
    }
  }

  // Fall back to copying key by key. This assumes all keys have a value,
  // so will not preserve sparsely populated inputs.
  var ret = Array(length);
  for (var ii = 0; ii < length; ii++) {
    ret[ii] = obj[ii];
  }
  return ret;
}

module.exports = toArray;

},{"./invariant":108}],128:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule traverseAllChildren
 */

"use strict";

var ReactInstanceHandles = require("./ReactInstanceHandles");
var ReactTextComponent = require("./ReactTextComponent");

var invariant = require("./invariant");

var SEPARATOR = ReactInstanceHandles.SEPARATOR;
var SUBSEPARATOR = ':';

/**
 * TODO: Test that:
 * 1. `mapChildren` transforms strings and numbers into `ReactTextComponent`.
 * 2. it('should fail when supplied duplicate key', function() {
 * 3. That a single child and an array with one item have the same key pattern.
 * });
 */

var userProvidedKeyEscaperLookup = {
  '=': '=0',
  '.': '=1',
  ':': '=2'
};

var userProvidedKeyEscapeRegex = /[=.:]/g;

function userProvidedKeyEscaper(match) {
  return userProvidedKeyEscaperLookup[match];
}

/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
function getComponentKey(component, index) {
  if (component && component.props && component.props.key != null) {
    // Explicit key
    return wrapUserProvidedKey(component.props.key);
  }
  // Implicit key determined by the index in the set
  return index.toString(36);
}

/**
 * Escape a component key so that it is safe to use in a reactid.
 *
 * @param {*} key Component key to be escaped.
 * @return {string} An escaped string.
 */
function escapeUserProvidedKey(text) {
  return ('' + text).replace(
    userProvidedKeyEscapeRegex,
    userProvidedKeyEscaper
  );
}

/**
 * Wrap a `key` value explicitly provided by the user to distinguish it from
 * implicitly-generated keys generated by a component's index in its parent.
 *
 * @param {string} key Value of a user-provided `key` attribute
 * @return {string}
 */
function wrapUserProvidedKey(key) {
  return '$' + escapeUserProvidedKey(key);
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!number} indexSoFar Number of children encountered until this point.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
var traverseAllChildrenImpl =
  function(children, nameSoFar, indexSoFar, callback, traverseContext) {
    var subtreeCount = 0;  // Count of children found in the current subtree.
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var nextName = (
          nameSoFar +
          (nameSoFar ? SUBSEPARATOR : SEPARATOR) +
          getComponentKey(child, i)
        );
        var nextIndex = indexSoFar + subtreeCount;
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          nextIndex,
          callback,
          traverseContext
        );
      }
    } else {
      var type = typeof children;
      var isOnlyChild = nameSoFar === '';
      // If it's the only child, treat the name as if it was wrapped in an array
      // so that it's consistent if the number of children grows
      var storageName =
        isOnlyChild ? SEPARATOR + getComponentKey(children, 0) : nameSoFar;
      if (children == null || type === 'boolean') {
        // All of the above are perceived as null.
        callback(traverseContext, null, storageName, indexSoFar);
        subtreeCount = 1;
      } else if (children.mountComponentIntoNode) {
        callback(traverseContext, children, storageName, indexSoFar);
        subtreeCount = 1;
      } else {
        if (type === 'object') {
          ("production" !== "development" ? invariant(
            !children || children.nodeType !== 1,
            'traverseAllChildren(...): Encountered an invalid child; DOM ' +
            'elements are not valid children of React components.'
          ) : invariant(!children || children.nodeType !== 1));
          for (var key in children) {
            if (children.hasOwnProperty(key)) {
              subtreeCount += traverseAllChildrenImpl(
                children[key],
                (
                  nameSoFar + (nameSoFar ? SUBSEPARATOR : SEPARATOR) +
                  wrapUserProvidedKey(key) + SUBSEPARATOR +
                  getComponentKey(children[key], 0)
                ),
                indexSoFar + subtreeCount,
                callback,
                traverseContext
              );
            }
          }
        } else if (type === 'string') {
          var normalizedText = new ReactTextComponent(children);
          callback(traverseContext, normalizedText, storageName, indexSoFar);
          subtreeCount += 1;
        } else if (type === 'number') {
          var normalizedNumber = new ReactTextComponent('' + children);
          callback(traverseContext, normalizedNumber, storageName, indexSoFar);
          subtreeCount += 1;
        }
      }
    }
    return subtreeCount;
  };

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children !== null && children !== undefined) {
    traverseAllChildrenImpl(children, '', 0, callback, traverseContext);
  }
}

module.exports = traverseAllChildren;

},{"./ReactInstanceHandles":53,"./ReactTextComponent":69,"./invariant":108}],129:[function(require,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule warning
 */

"use strict";

var emptyFunction = require("./emptyFunction");

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if ("production" !== "development") {
  warning = function(condition, format ) {var args=Array.prototype.slice.call(arguments,2);
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (!condition) {
      var argIndex = 0;
      console.warn('Warning: ' + format.replace(/%s/g, function()  {return args[argIndex++];}));
    }
  };
}

module.exports = warning;

},{"./emptyFunction":95}]},{},[24])
(24)
});
;(function(){
var f,aa=this;
function m(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==
b&&"undefined"==typeof a.call)return"object";return b}function ba(a){return a[da]||(a[da]=++ea)}var da="closure_uid_"+(1E9*Math.random()>>>0),ea=0;function fa(a,b){for(var c in a)b.call(void 0,a[c],c,a)};function ga(a,b){null!=a&&this.append.apply(this,arguments)}ga.prototype.Ha="";ga.prototype.append=function(a,b,c){this.Ha+=a;if(null!=b)for(var d=1;d<arguments.length;d++)this.Ha+=arguments[d];return this};ga.prototype.toString=function(){return this.Ha};var ha,ia=null;function ja(){return new n(null,5,[ka,!0,ma,!0,na,!1,oa,!1,pa,null],null)}function r(a){return null!=a&&!1!==a}function qa(a){return null==a}function ra(a){return r(a)?!1:!0}function t(a,b){return a[m(null==b?null:b)]?!0:a._?!0:u?!1:null}function sa(a){return null==a?null:a.constructor}function v(a,b){var c=sa(b),c=r(r(c)?c.tb:c)?c.sb:m(b);return Error(["No protocol method ",a," defined for type ",c,": ",b].join(""))}function ta(a){var b=a.sb;return r(b)?b:""+w(a)}
function ua(a){for(var b=a.length,c=Array(b),d=0;;)if(d<b)c[d]=a[d],d+=1;else break;return c}var xa=function(){function a(a,b){return wa.e?wa.e(function(a,b){a.push(b);return a},[],b):wa.call(null,function(a,b){a.push(b);return a},[],b)}function b(a){return c.c(null,a)}var c=null,c=function(d,c){switch(arguments.length){case 1:return b.call(this,d);case 2:return a.call(this,0,c)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}(),ya={},za={};
function Aa(a){if(a?a.aa:a)return a.aa(a);var b;b=Aa[m(null==a?null:a)];if(!b&&(b=Aa._,!b))throw v("ICloneable.-clone",a);return b.call(null,a)}var Ba={};function Ca(a){if(a?a.O:a)return a.O(a);var b;b=Ca[m(null==a?null:a)];if(!b&&(b=Ca._,!b))throw v("ICounted.-count",a);return b.call(null,a)}function Da(a){if(a?a.Q:a)return a.Q(a);var b;b=Da[m(null==a?null:a)];if(!b&&(b=Da._,!b))throw v("IEmptyableCollection.-empty",a);return b.call(null,a)}var Ea={};
function Fa(a,b){if(a?a.M:a)return a.M(a,b);var c;c=Fa[m(null==a?null:a)];if(!c&&(c=Fa._,!c))throw v("ICollection.-conj",a);return c.call(null,a,b)}
var Ga={},x=function(){function a(a,b,c){if(a?a.ea:a)return a.ea(a,b,c);var h;h=x[m(null==a?null:a)];if(!h&&(h=x._,!h))throw v("IIndexed.-nth",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.R:a)return a.R(a,b);var c;c=x[m(null==a?null:a)];if(!c&&(c=x._,!c))throw v("IIndexed.-nth",a);return c.call(null,a,b)}var c=null,c=function(d,c,g){switch(arguments.length){case 2:return b.call(this,d,c);case 3:return a.call(this,d,c,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}(),
Ia={};function y(a){if(a?a.W:a)return a.W(a);var b;b=y[m(null==a?null:a)];if(!b&&(b=y._,!b))throw v("ISeq.-first",a);return b.call(null,a)}function z(a){if(a?a.$:a)return a.$(a);var b;b=z[m(null==a?null:a)];if(!b&&(b=z._,!b))throw v("ISeq.-rest",a);return b.call(null,a)}
var Ja={},Ka={},A=function(){function a(a,b,c){if(a?a.F:a)return a.F(a,b,c);var h;h=A[m(null==a?null:a)];if(!h&&(h=A._,!h))throw v("ILookup.-lookup",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.D:a)return a.D(a,b);var c;c=A[m(null==a?null:a)];if(!c&&(c=A._,!c))throw v("ILookup.-lookup",a);return c.call(null,a,b)}var c=null,c=function(d,c,g){switch(arguments.length){case 2:return b.call(this,d,c);case 3:return a.call(this,d,c,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;
return c}();function La(a,b){if(a?a.Ja:a)return a.Ja(a,b);var c;c=La[m(null==a?null:a)];if(!c&&(c=La._,!c))throw v("IAssociative.-contains-key?",a);return c.call(null,a,b)}function Ma(a,b,c){if(a?a.ya:a)return a.ya(a,b,c);var d;d=Ma[m(null==a?null:a)];if(!d&&(d=Ma._,!d))throw v("IAssociative.-assoc",a);return d.call(null,a,b,c)}var Na={};function Oa(a,b){if(a?a.Va:a)return a.Va(a,b);var c;c=Oa[m(null==a?null:a)];if(!c&&(c=Oa._,!c))throw v("IMap.-dissoc",a);return c.call(null,a,b)}var Pa={};
function Qa(a){if(a?a.qb:a)return a.qb();var b;b=Qa[m(null==a?null:a)];if(!b&&(b=Qa._,!b))throw v("IMapEntry.-key",a);return b.call(null,a)}function Ra(a){if(a?a.yb:a)return a.yb();var b;b=Ra[m(null==a?null:a)];if(!b&&(b=Ra._,!b))throw v("IMapEntry.-val",a);return b.call(null,a)}var Sa={};function Ta(a,b){if(a?a.Ab:a)return a.Ab(0,b);var c;c=Ta[m(null==a?null:a)];if(!c&&(c=Ta._,!c))throw v("ISet.-disjoin",a);return c.call(null,a,b)}
function Ua(a){if(a?a.Ba:a)return a.Ba(a);var b;b=Ua[m(null==a?null:a)];if(!b&&(b=Ua._,!b))throw v("IStack.-peek",a);return b.call(null,a)}function Va(a){if(a?a.Ca:a)return a.Ca(a);var b;b=Va[m(null==a?null:a)];if(!b&&(b=Va._,!b))throw v("IStack.-pop",a);return b.call(null,a)}var Wa={};function Xa(a,b,c){if(a?a.rb:a)return a.rb(a,b,c);var d;d=Xa[m(null==a?null:a)];if(!d&&(d=Xa._,!d))throw v("IVector.-assoc-n",a);return d.call(null,a,b,c)}
function Ya(a){if(a?a.Ka:a)return a.Ka(a);var b;b=Ya[m(null==a?null:a)];if(!b&&(b=Ya._,!b))throw v("IDeref.-deref",a);return b.call(null,a)}var Za={};function $a(a){if(a?a.J:a)return a.J(a);var b;b=$a[m(null==a?null:a)];if(!b&&(b=$a._,!b))throw v("IMeta.-meta",a);return b.call(null,a)}var ab={};function bb(a,b){if(a?a.L:a)return a.L(a,b);var c;c=bb[m(null==a?null:a)];if(!c&&(c=bb._,!c))throw v("IWithMeta.-with-meta",a);return c.call(null,a,b)}
var cb={},db=function(){function a(a,b,c){if(a?a.V:a)return a.V(a,b,c);var h;h=db[m(null==a?null:a)];if(!h&&(h=db._,!h))throw v("IReduce.-reduce",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.U:a)return a.U(a,b);var c;c=db[m(null==a?null:a)];if(!c&&(c=db._,!c))throw v("IReduce.-reduce",a);return c.call(null,a,b)}var c=null,c=function(d,c,g){switch(arguments.length){case 2:return b.call(this,d,c);case 3:return a.call(this,d,c,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}();
function fb(a,b){if(a?a.A:a)return a.A(a,b);var c;c=fb[m(null==a?null:a)];if(!c&&(c=fb._,!c))throw v("IEquiv.-equiv",a);return c.call(null,a,b)}function gb(a){if(a?a.I:a)return a.I(a);var b;b=gb[m(null==a?null:a)];if(!b&&(b=gb._,!b))throw v("IHash.-hash",a);return b.call(null,a)}var hb={};function ib(a){if(a?a.K:a)return a.K(a);var b;b=ib[m(null==a?null:a)];if(!b&&(b=ib._,!b))throw v("ISeqable.-seq",a);return b.call(null,a)}var jb={},kb={},lb={};
function mb(a){if(a?a.Wa:a)return a.Wa(a);var b;b=mb[m(null==a?null:a)];if(!b&&(b=mb._,!b))throw v("IReversible.-rseq",a);return b.call(null,a)}function C(a,b){if(a?a.Fb:a)return a.Fb(0,b);var c;c=C[m(null==a?null:a)];if(!c&&(c=C._,!c))throw v("IWriter.-write",a);return c.call(null,a,b)}var nb={};function ob(a,b,c){if(a?a.C:a)return a.C(a,b,c);var d;d=ob[m(null==a?null:a)];if(!d&&(d=ob._,!d))throw v("IPrintWithWriter.-pr-writer",a);return d.call(null,a,b,c)}
function pb(a,b,c){if(a?a.Db:a)return a.Db(0,b,c);var d;d=pb[m(null==a?null:a)];if(!d&&(d=pb._,!d))throw v("IWatchable.-notify-watches",a);return d.call(null,a,b,c)}function qb(a,b,c){if(a?a.Cb:a)return a.Cb(0,b,c);var d;d=qb[m(null==a?null:a)];if(!d&&(d=qb._,!d))throw v("IWatchable.-add-watch",a);return d.call(null,a,b,c)}function rb(a,b){if(a?a.Eb:a)return a.Eb(0,b);var c;c=rb[m(null==a?null:a)];if(!c&&(c=rb._,!c))throw v("IWatchable.-remove-watch",a);return c.call(null,a,b)}
function sb(a){if(a?a.La:a)return a.La(a);var b;b=sb[m(null==a?null:a)];if(!b&&(b=sb._,!b))throw v("IEditableCollection.-as-transient",a);return b.call(null,a)}function tb(a,b){if(a?a.Oa:a)return a.Oa(a,b);var c;c=tb[m(null==a?null:a)];if(!c&&(c=tb._,!c))throw v("ITransientCollection.-conj!",a);return c.call(null,a,b)}function ub(a){if(a?a.Pa:a)return a.Pa(a);var b;b=ub[m(null==a?null:a)];if(!b&&(b=ub._,!b))throw v("ITransientCollection.-persistent!",a);return b.call(null,a)}
function vb(a,b,c){if(a?a.Na:a)return a.Na(a,b,c);var d;d=vb[m(null==a?null:a)];if(!d&&(d=vb._,!d))throw v("ITransientAssociative.-assoc!",a);return d.call(null,a,b,c)}function wb(a,b,c){if(a?a.Bb:a)return a.Bb(0,b,c);var d;d=wb[m(null==a?null:a)];if(!d&&(d=wb._,!d))throw v("ITransientVector.-assoc-n!",a);return d.call(null,a,b,c)}function xb(a){if(a?a.vb:a)return a.vb();var b;b=xb[m(null==a?null:a)];if(!b&&(b=xb._,!b))throw v("IChunk.-drop-first",a);return b.call(null,a)}
function yb(a){if(a?a.ab:a)return a.ab(a);var b;b=yb[m(null==a?null:a)];if(!b&&(b=yb._,!b))throw v("IChunkedSeq.-chunked-first",a);return b.call(null,a)}function zb(a){if(a?a.bb:a)return a.bb(a);var b;b=zb[m(null==a?null:a)];if(!b&&(b=zb._,!b))throw v("IChunkedSeq.-chunked-rest",a);return b.call(null,a)}function Ab(a){if(a?a.$a:a)return a.$a(a);var b;b=Ab[m(null==a?null:a)];if(!b&&(b=Ab._,!b))throw v("IChunkedNext.-chunked-next",a);return b.call(null,a)}
function Bb(a){this.yc=a;this.v=0;this.l=1073741824}Bb.prototype.Fb=function(a,b){return this.yc.append(b)};function Cb(a){var b=new ga;a.C(null,new Bb(b),ja());return""+w(b)}function Db(a,b){if(r(D.c?D.c(a,b):D.call(null,a,b)))return 0;var c=ra(a.Z);if(r(c?b.Z:c))return-1;if(r(a.Z)){if(ra(b.Z))return 1;c=Eb.c?Eb.c(a.Z,b.Z):Eb.call(null,a.Z,b.Z);return 0===c?Eb.c?Eb.c(a.name,b.name):Eb.call(null,a.name,b.name):c}return Fb?Eb.c?Eb.c(a.name,b.name):Eb.call(null,a.name,b.name):null}
function Gb(a,b,c,d,e){this.Z=a;this.name=b;this.wa=c;this.xa=d;this.fa=e;this.l=2154168321;this.v=4096}f=Gb.prototype;f.C=function(a,b){return C(b,this.wa)};f.I=function(){var a=this.xa;return null!=a?a:this.xa=a=Hb.c?Hb.c(E.f?E.f(this.Z):E.call(null,this.Z),E.f?E.f(this.name):E.call(null,this.name)):Hb.call(null,E.f?E.f(this.Z):E.call(null,this.Z),E.f?E.f(this.name):E.call(null,this.name))};f.L=function(a,b){return new Gb(this.Z,this.name,this.wa,this.xa,b)};f.J=function(){return this.fa};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return A.e(c,this,null);case 3:return A.e(c,this,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return A.e(a,this,null)};f.c=function(a,b){return A.e(a,this,b)};f.A=function(a,b){return b instanceof Gb?this.wa===b.wa:!1};f.toString=function(){return this.wa};
var Ib=function(){function a(a,b){var c=null!=a?[w(a),w("/"),w(b)].join(""):b;return new Gb(a,b,c,null,null)}function b(a){return a instanceof Gb?a:c.c(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}();function Jb(a){return Aa(a)}
function F(a){if(null==a)return null;if(a&&(a.l&8388608||a.ac))return a.K(null);if(a instanceof Array||"string"===typeof a)return 0===a.length?null:new Kb(a,0);if(t(hb,a))return ib(a);if(u)throw Error([w(a),w("is not ISeqable")].join(""));return null}function H(a){if(null==a)return null;if(a&&(a.l&64||a.Ma))return a.W(null);a=F(a);return null==a?null:y(a)}function I(a){return null!=a?a&&(a.l&64||a.Ma)?a.$(null):(a=F(a))?z(a):K:K}
function L(a){return null==a?null:a&&(a.l&128||a.zb)?a.ba(null):F(I(a))}
var D=function(){function a(a,b){return null==a?null==b:a===b||fb(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(b.c(a,d))if(L(e))a=d,d=H(e),e=L(e);else return b.c(d,H(e));else return!1}a.n=2;a.m=function(a){var b=H(a);a=L(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return!0;case 2:return a.call(this,b,e);
default:return c.j(b,e,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.n=2;b.m=c.m;b.f=function(){return!0};b.c=a;b.j=c.j;return b}();Ba["null"]=!0;Ca["null"]=function(){return 0};Date.prototype.Vb=!0;Date.prototype.A=function(a,b){return b instanceof Date&&this.toString()===b.toString()};fb.number=function(a,b){return a===b};Za["function"]=!0;$a["function"]=function(){return null};ya["function"]=!0;gb._=function(a){return ba(a)};function Lb(a){return a+1}
var Mb=function(){function a(a,b,c,d){for(var l=Ca(a);;)if(d<l)c=b.c?b.c(c,x.c(a,d)):b.call(null,c,x.c(a,d)),d+=1;else return c}function b(a,b,c){for(var d=Ca(a),l=0;;)if(l<d)c=b.c?b.c(c,x.c(a,l)):b.call(null,c,x.c(a,l)),l+=1;else return c}function c(a,b){var c=Ca(a);if(0===c)return b.P?b.P():b.call(null);for(var d=x.c(a,0),l=1;;)if(l<c)d=b.c?b.c(d,x.c(a,l)):b.call(null,d,x.c(a,l)),l+=1;else return d}var d=null,d=function(d,g,h,k){switch(arguments.length){case 2:return c.call(this,d,g);case 3:return b.call(this,
d,g,h);case 4:return a.call(this,d,g,h,k)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.e=b;d.t=a;return d}(),Nb=function(){function a(a,b,c,d){for(var l=a.length;;)if(d<l)c=b.c?b.c(c,a[d]):b.call(null,c,a[d]),d+=1;else return c}function b(a,b,c){for(var d=a.length,l=0;;)if(l<d)c=b.c?b.c(c,a[l]):b.call(null,c,a[l]),l+=1;else return c}function c(a,b){var c=a.length;if(0===a.length)return b.P?b.P():b.call(null);for(var d=a[0],l=1;;)if(l<c)d=b.c?b.c(d,a[l]):b.call(null,d,a[l]),l+=1;else return d}
var d=null,d=function(d,g,h,k){switch(arguments.length){case 2:return c.call(this,d,g);case 3:return b.call(this,d,g,h);case 4:return a.call(this,d,g,h,k)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.e=b;d.t=a;return d}();function Ob(a){return a?a.l&2||a.Sb?!0:a.l?!1:t(Ba,a):t(Ba,a)}function Pb(a){return a?a.l&16||a.wb?!0:a.l?!1:t(Ga,a):t(Ga,a)}function Kb(a,b){this.h=a;this.i=b;this.l=166199550;this.v=8192}f=Kb.prototype;f.toString=function(){return Cb(this)};
f.R=function(a,b){var c=b+this.i;return c<this.h.length?this.h[c]:null};f.ea=function(a,b,c){a=b+this.i;return a<this.h.length?this.h[a]:c};f.aa=function(){return new Kb(this.h,this.i)};f.ba=function(){return this.i+1<this.h.length?new Kb(this.h,this.i+1):null};f.O=function(){return this.h.length-this.i};f.Wa=function(){var a=Ca(this);return 0<a?new Qb(this,a-1,null):null};f.I=function(){return Rb.f?Rb.f(this):Rb.call(null,this)};f.A=function(a,b){return Sb.c?Sb.c(this,b):Sb.call(null,this,b)};
f.Q=function(){return K};f.U=function(a,b){return Nb.t(this.h,b,this.h[this.i],this.i+1)};f.V=function(a,b,c){return Nb.t(this.h,b,c,this.i)};f.W=function(){return this.h[this.i]};f.$=function(){return this.i+1<this.h.length?new Kb(this.h,this.i+1):K};f.K=function(){return this};f.M=function(a,b){return O.c?O.c(b,this):O.call(null,b,this)};
var Tb=function(){function a(a,b){return b<a.length?new Kb(a,b):null}function b(a){return c.c(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}(),N=function(){function a(a,b){return Tb.c(a,b)}function b(a){return Tb.c(a,0)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+
arguments.length);};c.f=b;c.c=a;return c}();function Qb(a,b,c){this.Ia=a;this.i=b;this.meta=c;this.l=32374990;this.v=8192}f=Qb.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.meta};f.aa=function(){return new Qb(this.Ia,this.i,this.meta)};f.ba=function(){return 0<this.i?new Qb(this.Ia,this.i-1,null):null};f.O=function(){return this.i+1};f.I=function(){return Rb.f?Rb.f(this):Rb.call(null,this)};f.A=function(a,b){return Sb.c?Sb.c(this,b):Sb.call(null,this,b)};
f.Q=function(){return Ub.c?Ub.c(K,this.meta):Ub.call(null,K,this.meta)};f.U=function(a,b){return P.c?P.c(b,this):P.call(null,b,this)};f.V=function(a,b,c){return P.e?P.e(b,c,this):P.call(null,b,c,this)};f.W=function(){return x.c(this.Ia,this.i)};f.$=function(){return 0<this.i?new Qb(this.Ia,this.i-1,null):K};f.K=function(){return this};f.L=function(a,b){return new Qb(this.Ia,this.i,b)};f.M=function(a,b){return O.c?O.c(b,this):O.call(null,b,this)};fb._=function(a,b){return a===b};
var Vb=function(){function a(a,b){return null!=a?Fa(a,b):Fa(K,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;)if(r(e))a=b.c(a,d),d=H(e),e=L(e);else return b.c(a,d)}a.n=2;a.m=function(a){var b=H(a);a=L(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.j(b,e,N(arguments,2))}throw Error("Invalid arity: "+
arguments.length);};b.n=2;b.m=c.m;b.c=a;b.j=c.j;return b}();function Q(a){if(null!=a)if(a&&(a.l&2||a.Sb))a=a.O(null);else if(a instanceof Array)a=a.length;else if("string"===typeof a)a=a.length;else if(t(Ba,a))a=Ca(a);else if(u)a:{a=F(a);for(var b=0;;){if(Ob(a)){a=b+Ca(a);break a}a=L(a);b+=1}a=void 0}else a=null;else a=0;return a}
var Wb=function(){function a(a,b,c){for(;;){if(null==a)return c;if(0===b)return F(a)?H(a):c;if(Pb(a))return x.e(a,b,c);if(F(a))a=L(a),b-=1;else return u?c:null}}function b(a,b){for(;;){if(null==a)throw Error("Index out of bounds");if(0===b){if(F(a))return H(a);throw Error("Index out of bounds");}if(Pb(a))return x.c(a,b);if(F(a)){var c=L(a),h=b-1;a=c;b=h}else{if(u)throw Error("Index out of bounds");return null}}}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}(),R=function(){function a(a,b,c){if("number"!==typeof b)throw Error("index argument to nth must be a number.");if(null==a)return c;if(a&&(a.l&16||a.wb))return a.ea(null,b,c);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:c;if(t(Ga,a))return x.c(a,b);if(a?a.l&64||a.Ma||(a.l?0:t(Ia,a)):t(Ia,a))return Wb.e(a,b,c);if(u)throw Error([w("nth not supported on this type "),w(ta(sa(a)))].join(""));return null}
function b(a,b){if("number"!==typeof b)throw Error("index argument to nth must be a number");if(null==a)return a;if(a&&(a.l&16||a.wb))return a.R(null,b);if(a instanceof Array||"string"===typeof a)return b<a.length?a[b]:null;if(t(Ga,a))return x.c(a,b);if(a?a.l&64||a.Ma||(a.l?0:t(Ia,a)):t(Ia,a))return Wb.c(a,b);if(u)throw Error([w("nth not supported on this type "),w(ta(sa(a)))].join(""));return null}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,
c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}(),S=function(){function a(a,b,c){return null!=a?a&&(a.l&256||a.xb)?a.F(null,b,c):a instanceof Array?b<a.length?a[b]:c:"string"===typeof a?b<a.length?a[b]:c:t(Ka,a)?A.e(a,b,c):u?c:null:c}function b(a,b){return null==a?null:a&&(a.l&256||a.xb)?a.D(null,b):a instanceof Array?b<a.length?a[b]:null:"string"===typeof a?b<a.length?a[b]:null:t(Ka,a)?A.c(a,b):null}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,
c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}(),T=function(){function a(a,b,c){return null!=a?Ma(a,b,c):Xb.c?Xb.c([b],[c]):Xb.call(null,[b],[c])}var b=null,c=function(){function a(b,d,k,l){var p=null;3<arguments.length&&(p=N(Array.prototype.slice.call(arguments,3),0));return c.call(this,b,d,k,p)}function c(a,d,e,l){for(;;)if(a=b.e(a,d,e),r(l))d=H(l),e=H(L(l)),l=L(L(l));else return a}a.n=3;a.m=function(a){var b=H(a);a=L(a);var d=H(a);
a=L(a);var l=H(a);a=I(a);return c(b,d,l,a)};a.j=c;return a}(),b=function(b,e,g,h){switch(arguments.length){case 3:return a.call(this,b,e,g);default:return c.j(b,e,g,N(arguments,3))}throw Error("Invalid arity: "+arguments.length);};b.n=3;b.m=c.m;b.e=a;b.j=c.j;return b}(),Yb=function(){function a(a,b){return null==a?null:Oa(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==
a)return null;a=b.c(a,d);if(r(e))d=H(e),e=L(e);else return a}}a.n=2;a.m=function(a){var b=H(a);a=L(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.j(b,e,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.n=2;b.m=c.m;b.f=function(a){return a};b.c=a;b.j=c.j;return b}();function Zb(a){var b="function"==m(a);return b?b:a?r(r(null)?null:a.Rb)?!0:a.Y?!1:t(ya,a):t(ya,a)}
var Ub=function $b(b,c){return Zb(b)&&!(b?b.l&262144||b.Oc||(b.l?0:t(ab,b)):t(ab,b))?$b(function(){"undefined"===typeof ha&&(ha=function(b,c,g,h){this.meta=b;this.Sa=c;this.Ac=g;this.hc=h;this.v=0;this.l=393217},ha.tb=!0,ha.sb="cljs.core/t7511",ha.Gb=function(b,c){return C(c,"cljs.core/t7511")},ha.prototype.call=function(){function b(d,h){d=this;var k=null;1<arguments.length&&(k=N(Array.prototype.slice.call(arguments,1),0));return c.call(this,d,k)}function c(b,d){return U.c?U.c(b.Sa,d):U.call(null,
b.Sa,d)}b.n=1;b.m=function(b){var d=H(b);b=I(b);return c(d,b)};b.j=c;return b}(),ha.prototype.apply=function(b,c){return this.call.apply(this,[this].concat(ua(c)))},ha.prototype.c=function(){function b(d){var h=null;0<arguments.length&&(h=N(Array.prototype.slice.call(arguments,0),0));return c.call(this,h)}function c(b){return U.c?U.c(self__.Sa,b):U.call(null,self__.Sa,b)}b.n=0;b.m=function(b){b=F(b);return c(b)};b.j=c;return b}(),ha.prototype.Rb=!0,ha.prototype.J=function(){return this.hc},ha.prototype.L=
function(b,c){return new ha(this.meta,this.Sa,this.Ac,c)});return new ha(c,b,$b,null)}(),c):null==b?null:bb(b,c)};function ac(a){var b=null!=a;return(b?a?a.l&131072||a.Xb||(a.l?0:t(Za,a)):t(Za,a):b)?$a(a):null}
var bc=function(){function a(a,b){return null==a?null:Ta(a,b)}var b=null,c=function(){function a(b,d,k){var l=null;2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){for(;;){if(null==a)return null;a=b.c(a,d);if(r(e))d=H(e),e=L(e);else return a}}a.n=2;a.m=function(a){var b=H(a);a=L(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return b;case 2:return a.call(this,b,e);default:return c.j(b,
e,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.n=2;b.m=c.m;b.f=function(a){return a};b.c=a;b.j=c.j;return b}(),cc={},dc=0;function E(a){if(a&&(a.l&4194304||a.Hc))a=a.I(null);else if("number"===typeof a)a=Math.floor(a)%2147483647;else if(!0===a)a=1;else if(!1===a)a=0;else if("string"===typeof a){255<dc&&(cc={},dc=0);var b=cc[a];if("number"!==typeof b){for(var c=b=0;c<a.length;++c)b=31*b+a.charCodeAt(c),b%=4294967296;cc[a]=b;dc+=1}a=b}else a=null==a?0:u?gb(a):null;return a}
function ec(a){return null==a||ra(F(a))}function fc(a){return a?a.l&16777216||a.Lc?!0:a.l?!1:t(jb,a):t(jb,a)}function gc(a){return null==a?!1:a?a.l&1024||a.Jc?!0:a.l?!1:t(Na,a):t(Na,a)}function hc(a){return a?a.l&16384||a.Nc?!0:a.l?!1:t(Wa,a):t(Wa,a)}function ic(a){return a?a.v&512||a.Cc?!0:!1:!1}function jc(a){var b=[];fa(a,function(a){return function(b,e){return a.push(e)}}(b));return b}function kc(a,b,c,d,e){for(;0!==e;)c[d]=a[b],d+=1,e-=1,b+=1}var lc={};
function mc(a){return null==a?!1:a?a.l&64||a.Ma?!0:a.l?!1:t(Ia,a):t(Ia,a)}function nc(a){return r(a)?!0:!1}function oc(a,b){return S.e(a,b,lc)===lc?!1:!0}function Eb(a,b){if(a===b)return 0;if(null==a)return-1;if(null==b)return 1;if(sa(a)===sa(b))return a&&(a.v&2048||a.Ta)?a.Ua(null,b):a>b?1:a<b?-1:0;if(u)throw Error("compare on non-nil objects of different types");return null}
var pc=function(){function a(a,b,c,h){for(;;){var k=Eb(R.c(a,h),R.c(b,h));if(0===k&&h+1<c)h+=1;else return k}}function b(a,b){var g=Q(a),h=Q(b);return g<h?-1:g>h?1:u?c.t(a,b,g,0):null}var c=null,c=function(c,e,g,h){switch(arguments.length){case 2:return b.call(this,c,e);case 4:return a.call(this,c,e,g,h)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.t=a;return c}(),P=function(){function a(a,b,c){for(c=F(c);;)if(c)b=a.c?a.c(b,H(c)):a.call(null,b,H(c)),c=L(c);else return b}function b(a,
b){var c=F(b);return c?wa.e?wa.e(a,H(c),L(c)):wa.call(null,a,H(c),L(c)):a.P?a.P():a.call(null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}(),wa=function(){function a(a,b,c){return c&&(c.l&524288||c.Zb)?c.V(null,a,b):c instanceof Array?Nb.e(c,a,b):"string"===typeof c?Nb.e(c,a,b):t(cb,c)?db.e(c,a,b):u?P.e(a,b,c):null}function b(a,b){return b&&(b.l&524288||
b.Zb)?b.U(null,a):b instanceof Array?Nb.c(b,a):"string"===typeof b?Nb.c(b,a):t(cb,b)?db.c(b,a):u?P.c(a,b):null}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}();function qc(a){return 0<=a?Math.floor.f?Math.floor.f(a):Math.floor.call(null,a):Math.ceil.f?Math.ceil.f(a):Math.ceil.call(null,a)}
function rc(a){a-=a>>1&1431655765;a=(a&858993459)+(a>>2&858993459);return 16843009*(a+(a>>4)&252645135)>>24}function sc(a){var b=1;for(a=F(a);;)if(a&&0<b)b-=1,a=L(a);else return a}
var w=function(){function a(a){return null==a?"":a.toString()}var b=null,c=function(){function a(b,d){var k=null;1<arguments.length&&(k=N(Array.prototype.slice.call(arguments,1),0));return c.call(this,b,k)}function c(a,d){for(var e=new ga(b.f(a)),l=d;;)if(r(l))e=e.append(b.f(H(l))),l=L(l);else return e.toString()}a.n=1;a.m=function(a){var b=H(a);a=I(a);return c(b,a)};a.j=c;return a}(),b=function(b,e){switch(arguments.length){case 0:return"";case 1:return a.call(this,b);default:return c.j(b,N(arguments,
1))}throw Error("Invalid arity: "+arguments.length);};b.n=1;b.m=c.m;b.P=function(){return""};b.f=a;b.j=c.j;return b}(),tc=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return a.substring(c);case 3:return a.substring(c,d)}throw Error("Invalid arity: "+arguments.length);};a.c=function(a,c){return a.substring(c)};a.e=function(a,c,d){return a.substring(c,d)};return a}();
function Sb(a,b){return nc(fc(b)?function(){for(var c=F(a),d=F(b);;){if(null==c)return null==d;if(null==d)return!1;if(D.c(H(c),H(d)))c=L(c),d=L(d);else return u?!1:null}}():null)}function Hb(a,b){return a^b+2654435769+(a<<6)+(a>>2)}function Rb(a){if(F(a)){var b=E(H(a));for(a=L(a);;){if(null==a)return b;b=Hb(b,E(H(a)));a=L(a)}}else return 0}
function uc(a){var b=0;for(a=F(a);;)if(a){var c=H(a),b=(b+(E(vc.f?vc.f(c):vc.call(null,c))^E(wc.f?wc.f(c):wc.call(null,c))))%4503599627370496;a=L(a)}else return b}function xc(a,b,c,d,e){this.meta=a;this.ra=b;this.ka=c;this.count=d;this.o=e;this.l=65937646;this.v=8192}f=xc.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.meta};f.aa=function(){return new xc(this.meta,this.ra,this.ka,this.count,this.o)};f.ba=function(){return 1===this.count?null:this.ka};f.O=function(){return this.count};
f.Ba=function(){return this.ra};f.Ca=function(){return z(this)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return K};f.U=function(a,b){return P.c(b,this)};f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){return this.ra};f.$=function(){return 1===this.count?K:this.ka};f.K=function(){return this};f.L=function(a,b){return new xc(b,this.ra,this.ka,this.count,this.o)};
f.M=function(a,b){return new xc(this.meta,b,this,this.count+1,null)};function yc(a){this.meta=a;this.l=65937614;this.v=8192}f=yc.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.meta};f.aa=function(){return new yc(this.meta)};f.ba=function(){return null};f.O=function(){return 0};f.Ba=function(){return null};f.Ca=function(){throw Error("Can't pop empty list");};f.I=function(){return 0};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return this};
f.U=function(a,b){return P.c(b,this)};f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){return null};f.$=function(){return K};f.K=function(){return null};f.L=function(a,b){return new yc(b)};f.M=function(a,b){return new xc(this.meta,b,null,1,null)};
var K=new yc(null),zc=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){var b;if(a instanceof Kb&&0===a.i)b=a.h;else a:{for(b=[];;)if(null!=a)b.push(a.W(null)),a=a.ba(null);else break a;b=void 0}a=b.length;for(var e=K;;)if(0<a){var g=a-1,e=e.M(null,b[a-1]);a=g}else return e}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}();
function Ac(a,b,c,d){this.meta=a;this.ra=b;this.ka=c;this.o=d;this.l=65929452;this.v=8192}f=Ac.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.meta};f.aa=function(){return new Ac(this.meta,this.ra,this.ka,this.o)};f.ba=function(){return null==this.ka?null:F(this.ka)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.meta)};f.U=function(a,b){return P.c(b,this)};
f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){return this.ra};f.$=function(){return null==this.ka?K:this.ka};f.K=function(){return this};f.L=function(a,b){return new Ac(b,this.ra,this.ka,this.o)};f.M=function(a,b){return new Ac(null,b,this,this.o)};function O(a,b){var c=null==b;return(c?c:b&&(b.l&64||b.Ma))?new Ac(null,a,b,null):new Ac(null,a,F(b),null)}function V(a,b,c,d){this.Z=a;this.name=b;this.sa=c;this.xa=d;this.l=2153775105;this.v=4096}f=V.prototype;
f.C=function(a,b){return C(b,[w(":"),w(this.sa)].join(""))};f.I=function(){null==this.xa&&(this.xa=Hb(E(this.Z),E(this.name))+2654435769);return this.xa};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return S.c(c,this);case 3:return S.e(c,this,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return S.c(a,this)};f.c=function(a,b){return S.e(a,this,b)};
f.A=function(a,b){return b instanceof V?this.sa===b.sa:!1};f.toString=function(){return[w(":"),w(this.sa)].join("")};
var Cc=function(){function a(a,b){return new V(a,b,[w(r(a)?[w(a),w("/")].join(""):null),w(b)].join(""),null)}function b(a){if(a instanceof V)return a;if(a instanceof Gb){var b;if(a&&(a.v&4096||a.Yb))b=a.Z;else throw Error([w("Doesn't support namespace: "),w(a)].join(""));return new V(b,Bc.f?Bc.f(a):Bc.call(null,a),a.wa,null)}return"string"===typeof a?(b=a.split("/"),2===b.length?new V(b[0],b[1],a,null):new V(null,b[0],a,null)):null}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}();function W(a,b,c,d){this.meta=a;this.Fa=b;this.s=c;this.o=d;this.v=0;this.l=32374988}f=W.prototype;f.toString=function(){return Cb(this)};function Ec(a){null!=a.Fa&&(a.s=a.Fa.P?a.Fa.P():a.Fa.call(null),a.Fa=null);return a.s}f.J=function(){return this.meta};f.ba=function(){ib(this);return null==this.s?null:L(this.s)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};
f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.meta)};f.U=function(a,b){return P.c(b,this)};f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){ib(this);return null==this.s?null:H(this.s)};f.$=function(){ib(this);return null!=this.s?I(this.s):K};f.K=function(){Ec(this);if(null==this.s)return null;for(var a=this.s;;)if(a instanceof W)a=Ec(a);else return this.s=a,F(this.s)};f.L=function(a,b){return new W(b,this.Fa,this.s,this.o)};f.M=function(a,b){return O(b,this)};
function Fc(a,b){this.Za=a;this.end=b;this.v=0;this.l=2}Fc.prototype.O=function(){return this.end};Fc.prototype.add=function(a){this.Za[this.end]=a;return this.end+=1};Fc.prototype.la=function(){var a=new Gc(this.Za,0,this.end);this.Za=null;return a};function Gc(a,b,c){this.h=a;this.G=b;this.end=c;this.v=0;this.l=524306}f=Gc.prototype;f.U=function(a,b){return Nb.t(this.h,b,this.h[this.G],this.G+1)};f.V=function(a,b,c){return Nb.t(this.h,b,c,this.G)};
f.vb=function(){if(this.G===this.end)throw Error("-drop-first of empty chunk");return new Gc(this.h,this.G+1,this.end)};f.R=function(a,b){return this.h[this.G+b]};f.ea=function(a,b,c){return 0<=b&&b<this.end-this.G?this.h[this.G+b]:c};f.O=function(){return this.end-this.G};
var Hc=function(){function a(a,b,c){return new Gc(a,b,c)}function b(a,b){return new Gc(a,b,a.length)}function c(a){return new Gc(a,0,a.length)}var d=null,d=function(d,g,h){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,g);case 3:return a.call(this,d,g,h)}throw Error("Invalid arity: "+arguments.length);};d.f=c;d.c=b;d.e=a;return d}();function Ic(a,b,c,d){this.la=a;this.ma=b;this.meta=c;this.o=d;this.l=31850732;this.v=1536}f=Ic.prototype;f.toString=function(){return Cb(this)};
f.J=function(){return this.meta};f.ba=function(){if(1<Ca(this.la))return new Ic(xb(this.la),this.ma,this.meta,null);var a=ib(this.ma);return null==a?null:a};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.meta)};f.W=function(){return x.c(this.la,0)};f.$=function(){return 1<Ca(this.la)?new Ic(xb(this.la),this.ma,this.meta,null):null==this.ma?K:this.ma};f.K=function(){return this};f.ab=function(){return this.la};
f.bb=function(){return null==this.ma?K:this.ma};f.L=function(a,b){return new Ic(this.la,this.ma,b,this.o)};f.M=function(a,b){return O(b,this)};f.$a=function(){return null==this.ma?null:this.ma};function Jc(a,b){return 0===Ca(a)?b:new Ic(a,b,null,null)}function Kc(a){for(var b=[];;)if(F(a))b.push(H(a)),a=L(a);else return b}function Lc(a,b){if(Ob(a))return Q(a);for(var c=a,d=b,e=0;;)if(0<d&&F(c))c=L(c),d-=1,e+=1;else return e}
var Nc=function Mc(b){return null==b?null:null==L(b)?F(H(b)):u?O(H(b),Mc(L(b))):null},Oc=function(){function a(a,b){return new W(null,function(){var c=F(a);return c?ic(c)?Jc(yb(c),d.c(zb(c),b)):O(H(c),d.c(I(c),b)):b},null,null)}function b(a){return new W(null,function(){return a},null,null)}function c(){return new W(null,function(){return null},null,null)}var d=null,e=function(){function a(c,d,e){var g=null;2<arguments.length&&(g=N(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,
d,g)}function b(a,c,e){return function s(a,b){return new W(null,function(){var c=F(a);return c?ic(c)?Jc(yb(c),s(zb(c),b)):O(H(c),s(I(c),b)):r(b)?s(H(b),L(b)):null},null,null)}(d.c(a,c),e)}a.n=2;a.m=function(a){var c=H(a);a=L(a);var d=H(a);a=I(a);return b(c,d,a)};a.j=b;return a}(),d=function(d,h,k){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,d);case 2:return a.call(this,d,h);default:return e.j(d,h,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};d.n=
2;d.m=e.m;d.P=c;d.f=b;d.c=a;d.j=e.j;return d}(),Pc=function(){function a(a,b,c,d){return O(a,O(b,O(c,d)))}function b(a,b,c){return O(a,O(b,c))}var c=null,d=function(){function a(c,d,e,p,q){var s=null;4<arguments.length&&(s=N(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,p,s)}function b(a,c,d,e,g){return O(a,O(c,O(d,O(e,Nc(g)))))}a.n=4;a.m=function(a){var c=H(a);a=L(a);var d=H(a);a=L(a);var e=H(a);a=L(a);var q=H(a);a=I(a);return b(c,d,e,q,a)};a.j=b;return a}(),c=function(c,g,
h,k,l){switch(arguments.length){case 1:return F(c);case 2:return O(c,g);case 3:return b.call(this,c,g,h);case 4:return a.call(this,c,g,h,k);default:return d.j(c,g,h,k,N(arguments,4))}throw Error("Invalid arity: "+arguments.length);};c.n=4;c.m=d.m;c.f=function(a){return F(a)};c.c=function(a,b){return O(a,b)};c.e=b;c.t=a;c.j=d.j;return c}(),Qc=function(){var a=null,b=function(){function a(c,g,h,k){var l=null;3<arguments.length&&(l=N(Array.prototype.slice.call(arguments,3),0));return b.call(this,c,g,
h,l)}function b(a,c,d,k){for(;;)if(a=vb(a,c,d),r(k))c=H(k),d=H(L(k)),k=L(L(k));else return a}a.n=3;a.m=function(a){var c=H(a);a=L(a);var h=H(a);a=L(a);var k=H(a);a=I(a);return b(c,h,k,a)};a.j=b;return a}(),a=function(a,d,e,g){switch(arguments.length){case 3:return vb(a,d,e);default:return b.j(a,d,e,N(arguments,3))}throw Error("Invalid arity: "+arguments.length);};a.n=3;a.m=b.m;a.e=function(a,b,e){return vb(a,b,e)};a.j=b.j;return a}();
function Rc(a,b,c){var d=F(c);if(0===b)return a.P?a.P():a.call(null);c=y(d);var e=z(d);if(1===b)return a.f?a.f(c):a.f?a.f(c):a.call(null,c);var d=y(e),g=z(e);if(2===b)return a.c?a.c(c,d):a.c?a.c(c,d):a.call(null,c,d);var e=y(g),h=z(g);if(3===b)return a.e?a.e(c,d,e):a.e?a.e(c,d,e):a.call(null,c,d,e);var g=y(h),k=z(h);if(4===b)return a.t?a.t(c,d,e,g):a.t?a.t(c,d,e,g):a.call(null,c,d,e,g);var h=y(k),l=z(k);if(5===b)return a.N?a.N(c,d,e,g,h):a.N?a.N(c,d,e,g,h):a.call(null,c,d,e,g,h);var k=y(l),p=z(l);
if(6===b)return a.ga?a.ga(c,d,e,g,h,k):a.ga?a.ga(c,d,e,g,h,k):a.call(null,c,d,e,g,h,k);var l=y(p),q=z(p);if(7===b)return a.Aa?a.Aa(c,d,e,g,h,k,l):a.Aa?a.Aa(c,d,e,g,h,k,l):a.call(null,c,d,e,g,h,k,l);var p=y(q),s=z(q);if(8===b)return a.ob?a.ob(c,d,e,g,h,k,l,p):a.ob?a.ob(c,d,e,g,h,k,l,p):a.call(null,c,d,e,g,h,k,l,p);var q=y(s),B=z(s);if(9===b)return a.pb?a.pb(c,d,e,g,h,k,l,p,q):a.pb?a.pb(c,d,e,g,h,k,l,p,q):a.call(null,c,d,e,g,h,k,l,p,q);var s=y(B),J=z(B);if(10===b)return a.cb?a.cb(c,d,e,g,h,k,l,p,q,
s):a.cb?a.cb(c,d,e,g,h,k,l,p,q,s):a.call(null,c,d,e,g,h,k,l,p,q,s);var B=y(J),G=z(J);if(11===b)return a.eb?a.eb(c,d,e,g,h,k,l,p,q,s,B):a.eb?a.eb(c,d,e,g,h,k,l,p,q,s,B):a.call(null,c,d,e,g,h,k,l,p,q,s,B);var J=y(G),M=z(G);if(12===b)return a.fb?a.fb(c,d,e,g,h,k,l,p,q,s,B,J):a.fb?a.fb(c,d,e,g,h,k,l,p,q,s,B,J):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J);var G=y(M),ca=z(M);if(13===b)return a.gb?a.gb(c,d,e,g,h,k,l,p,q,s,B,J,G):a.gb?a.gb(c,d,e,g,h,k,l,p,q,s,B,J,G):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G);var M=y(ca),
la=z(ca);if(14===b)return a.hb?a.hb(c,d,e,g,h,k,l,p,q,s,B,J,G,M):a.hb?a.hb(c,d,e,g,h,k,l,p,q,s,B,J,G,M):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G,M);var ca=y(la),va=z(la);if(15===b)return a.ib?a.ib(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca):a.ib?a.ib(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca);var la=y(va),Ha=z(va);if(16===b)return a.jb?a.jb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la):a.jb?a.jb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la);var va=y(Ha),
eb=z(Ha);if(17===b)return a.kb?a.kb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va):a.kb?a.kb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va);var Ha=y(eb),Dc=z(eb);if(18===b)return a.lb?a.lb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha):a.lb?a.lb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha);eb=y(Dc);Dc=z(Dc);if(19===b)return a.mb?a.mb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha,eb):a.mb?a.mb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,
Ha,eb):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha,eb);var $d=y(Dc);z(Dc);if(20===b)return a.nb?a.nb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha,eb,$d):a.nb?a.nb(c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha,eb,$d):a.call(null,c,d,e,g,h,k,l,p,q,s,B,J,G,M,ca,la,va,Ha,eb,$d);throw Error("Only up to 20 arguments supported on functions");}
var U=function(){function a(a,b,c,d,e){b=Pc.t(b,c,d,e);c=a.n;return a.m?(d=Lc(b,c+1),d<=c?Rc(a,d,b):a.m(b)):a.apply(a,Kc(b))}function b(a,b,c,d){b=Pc.e(b,c,d);c=a.n;return a.m?(d=Lc(b,c+1),d<=c?Rc(a,d,b):a.m(b)):a.apply(a,Kc(b))}function c(a,b,c){b=Pc.c(b,c);c=a.n;if(a.m){var d=Lc(b,c+1);return d<=c?Rc(a,d,b):a.m(b)}return a.apply(a,Kc(b))}function d(a,b){var c=a.n;if(a.m){var d=Lc(b,c+1);return d<=c?Rc(a,d,b):a.m(b)}return a.apply(a,Kc(b))}var e=null,g=function(){function a(c,d,e,g,h,J){var G=null;
5<arguments.length&&(G=N(Array.prototype.slice.call(arguments,5),0));return b.call(this,c,d,e,g,h,G)}function b(a,c,d,e,g,h){c=O(c,O(d,O(e,O(g,Nc(h)))));d=a.n;return a.m?(e=Lc(c,d+1),e<=d?Rc(a,e,c):a.m(c)):a.apply(a,Kc(c))}a.n=5;a.m=function(a){var c=H(a);a=L(a);var d=H(a);a=L(a);var e=H(a);a=L(a);var g=H(a);a=L(a);var h=H(a);a=I(a);return b(c,d,e,g,h,a)};a.j=b;return a}(),e=function(e,k,l,p,q,s){switch(arguments.length){case 2:return d.call(this,e,k);case 3:return c.call(this,e,k,l);case 4:return b.call(this,
e,k,l,p);case 5:return a.call(this,e,k,l,p,q);default:return g.j(e,k,l,p,q,N(arguments,5))}throw Error("Invalid arity: "+arguments.length);};e.n=5;e.m=g.m;e.c=d;e.e=c;e.t=b;e.N=a;e.j=g.j;return e}(),Sc=function(){function a(a,b){return!D.c(a,b)}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){return ra(U.t(D,a,c,d))}a.n=2;a.m=function(a){var c=H(a);a=L(a);var d=H(a);a=I(a);return b(c,
d,a)};a.j=b;return a}(),b=function(b,e,g){switch(arguments.length){case 1:return!1;case 2:return a.call(this,b,e);default:return c.j(b,e,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.n=2;b.m=c.m;b.f=function(){return!1};b.c=a;b.j=c.j;return b}();function Tc(a,b){for(;;){if(null==F(b))return!0;if(r(a.f?a.f(H(b)):a.call(null,H(b)))){var c=a,d=L(b);a=c;b=d}else return u?!1:null}}
function Uc(a){for(var b=Vc;;)if(F(a)){var c=b.f?b.f(H(a)):b.call(null,H(a));if(r(c))return c;a=L(a)}else return null}function Vc(a){return a}
function Wc(a){return function(){var b=null,c=function(){function b(a,d,k){var l=null;2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return c.call(this,a,d,l)}function c(b,d,e){return ra(U.t(a,b,d,e))}b.n=2;b.m=function(a){var b=H(a);a=L(a);var d=H(a);a=I(a);return c(b,d,a)};b.j=c;return b}(),b=function(b,e,g){switch(arguments.length){case 0:return ra(a.P?a.P():a.call(null));case 1:return ra(a.f?a.f(b):a.call(null,b));case 2:return ra(a.c?a.c(b,e):a.call(null,b,e));default:return c.j(b,
e,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.n=2;b.m=c.m;return b}()}
var Xc=function(){function a(a,b,c,e){return new W(null,function(){var p=F(b),q=F(c),s=F(e);return p&&q&&s?O(a.e?a.e(H(p),H(q),H(s)):a.call(null,H(p),H(q),H(s)),d.t(a,I(p),I(q),I(s))):null},null,null)}function b(a,b,c){return new W(null,function(){var e=F(b),p=F(c);return e&&p?O(a.c?a.c(H(e),H(p)):a.call(null,H(e),H(p)),d.e(a,I(e),I(p))):null},null,null)}function c(a,b){return new W(null,function(){var c=F(b);if(c){if(ic(c)){for(var e=yb(c),p=Q(e),q=new Fc(Array(p),0),s=0;;)if(s<p){var B=a.f?a.f(x.c(e,
s)):a.call(null,x.c(e,s));q.add(B);s+=1}else break;return Jc(q.la(),d.c(a,zb(c)))}return O(a.f?a.f(H(c)):a.call(null,H(c)),d.c(a,I(c)))}return null},null,null)}var d=null,e=function(){function a(c,d,e,g,s){var B=null;4<arguments.length&&(B=N(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,g,B)}function b(a,c,e,g,h){var B=function G(a){return new W(null,function(){var b=d.c(F,a);return Tc(Vc,b)?O(d.c(H,b),G(d.c(I,b))):null},null,null)};return d.c(function(){return function(b){return U.c(a,
b)}}(B),B(Vb.j(h,g,N([e,c],0))))}a.n=4;a.m=function(a){var c=H(a);a=L(a);var d=H(a);a=L(a);var e=H(a);a=L(a);var g=H(a);a=I(a);return b(c,d,e,g,a)};a.j=b;return a}(),d=function(d,h,k,l,p){switch(arguments.length){case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.j(d,h,k,l,N(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.n=4;d.m=e.m;d.c=c;d.e=b;d.t=a;d.j=e.j;return d}(),Zc=function Yc(b,c){return new W(null,function(){if(0<
b){var d=F(c);return d?O(H(d),Yc(b-1,I(d))):null}return null},null,null)};function $c(a,b){return new W(null,function(c){return function(){return c(a,b)}}(function(a,b){for(;;){var e=F(b);if(0<a&&e){var g=a-1,e=I(e);a=g;b=e}else return e}}),null,null)}
var ad=function(){function a(a,b){return Zc(a,c.f(b))}function b(a){return new W(null,function(){return O(a,c.f(a))},null,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}(),bd=function(){function a(a,c){return new W(null,function(){var g=F(a),h=F(c);return g&&h?O(H(g),O(H(h),b.c(I(g),I(h)))):null},null,null)}var b=null,c=function(){function a(b,d,k){var l=null;
2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return c.call(this,b,d,l)}function c(a,d,e){return new W(null,function(){var c=Xc.c(F,Vb.j(e,d,N([a],0)));return Tc(Vc,c)?Oc.c(Xc.c(H,c),U.c(b,Xc.c(I,c))):null},null,null)}a.n=2;a.m=function(a){var b=H(a);a=L(a);var d=H(a);a=I(a);return c(b,d,a)};a.j=c;return a}(),b=function(b,e,g){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.j(b,e,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};b.n=
2;b.m=c.m;b.c=a;b.j=c.j;return b}();function cd(a,b){return $c(1,bd.c(ad.f(a),b))}function dd(a){return function c(a,e){return new W(null,function(){var g=F(a);return g?O(H(g),c(I(g),e)):F(e)?c(H(e),I(e)):null},null,null)}(null,a)}
var ed=function(){function a(a,b){return dd(Xc.c(a,b))}var b=null,c=function(){function a(c,d,k){var l=null;2<arguments.length&&(l=N(Array.prototype.slice.call(arguments,2),0));return b.call(this,c,d,l)}function b(a,c,d){return dd(U.t(Xc,a,c,d))}a.n=2;a.m=function(a){var c=H(a);a=L(a);var d=H(a);a=I(a);return b(c,d,a)};a.j=b;return a}(),b=function(b,e,g){switch(arguments.length){case 2:return a.call(this,b,e);default:return c.j(b,e,N(arguments,2))}throw Error("Invalid arity: "+arguments.length);};
b.n=2;b.m=c.m;b.c=a;b.j=c.j;return b}(),gd=function fd(b,c){return new W(null,function(){var d=F(c);if(d){if(ic(d)){for(var e=yb(d),g=Q(e),h=new Fc(Array(g),0),k=0;;)if(k<g){if(r(b.f?b.f(x.c(e,k)):b.call(null,x.c(e,k)))){var l=x.c(e,k);h.add(l)}k+=1}else break;return Jc(h.la(),fd(b,zb(d)))}e=H(d);d=I(d);return r(b.f?b.f(e):b.call(null,e))?O(e,fd(b,d)):fd(b,d)}return null},null,null)};function hd(a,b){return gd(Wc(a),b)}
function id(a){return function c(a){return new W(null,function(){return O(a,r(fc.f?fc.f(a):fc.call(null,a))?ed.c(c,F.f?F.f(a):F.call(null,a)):null)},null,null)}(a)}function jd(a){return gd(function(a){return!fc(a)},I(id(a)))}function kd(a,b){var c;null!=a?a&&(a.v&4||a.Gc)?(c=wa.e(tb,sb(a),b),c=ub(c)):c=wa.e(Fa,a,b):c=wa.e(Vb,K,b);return c}
var ld=function(){function a(a,b,c,k){return new W(null,function(){var l=F(k);if(l){var p=Zc(a,l);return a===Q(p)?O(p,d.t(a,b,c,$c(b,l))):Fa(K,Zc(a,Oc.c(p,c)))}return null},null,null)}function b(a,b,c){return new W(null,function(){var k=F(c);if(k){var l=Zc(a,k);return a===Q(l)?O(l,d.e(a,b,$c(b,k))):null}return null},null,null)}function c(a,b){return d.e(a,a,b)}var d=null,d=function(d,g,h,k){switch(arguments.length){case 2:return c.call(this,d,g);case 3:return b.call(this,d,g,h);case 4:return a.call(this,
d,g,h,k)}throw Error("Invalid arity: "+arguments.length);};d.c=c;d.e=b;d.t=a;return d}(),md=function(){function a(a,b,c){var h=lc;for(b=F(b);;)if(b){var k=a;if(k?k.l&256||k.xb||(k.l?0:t(Ka,k)):t(Ka,k)){a=S.e(a,H(b),h);if(h===a)return c;b=L(b)}else return c}else return a}function b(a,b){return c.e(a,b,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}(),od=
function nd(b,c,d){var e=R.e(c,0,null);return(c=sc(c))?T.e(b,e,nd(S.c(b,e),c,d)):T.e(b,e,d)},pd=function(){function a(a,b,c,d,g,s){var B=R.e(b,0,null);return(b=sc(b))?T.e(a,B,e.ga(S.c(a,B),b,c,d,g,s)):T.e(a,B,c.t?c.t(S.c(a,B),d,g,s):c.call(null,S.c(a,B),d,g,s))}function b(a,b,c,d,g){var s=R.e(b,0,null);return(b=sc(b))?T.e(a,s,e.N(S.c(a,s),b,c,d,g)):T.e(a,s,c.e?c.e(S.c(a,s),d,g):c.call(null,S.c(a,s),d,g))}function c(a,b,c,d){var g=R.e(b,0,null);return(b=sc(b))?T.e(a,g,e.t(S.c(a,g),b,c,d)):T.e(a,g,
c.c?c.c(S.c(a,g),d):c.call(null,S.c(a,g),d))}function d(a,b,c){var d=R.e(b,0,null);return(b=sc(b))?T.e(a,d,e.e(S.c(a,d),b,c)):T.e(a,d,c.f?c.f(S.c(a,d)):c.call(null,S.c(a,d)))}var e=null,g=function(){function a(c,d,e,g,h,J,G){var M=null;6<arguments.length&&(M=N(Array.prototype.slice.call(arguments,6),0));return b.call(this,c,d,e,g,h,J,M)}function b(a,c,d,g,h,k,G){var M=R.e(c,0,null);return(c=sc(c))?T.e(a,M,U.j(e,S.c(a,M),c,d,g,N([h,k,G],0))):T.e(a,M,U.j(d,S.c(a,M),g,h,k,N([G],0)))}a.n=6;a.m=function(a){var c=
H(a);a=L(a);var d=H(a);a=L(a);var e=H(a);a=L(a);var g=H(a);a=L(a);var h=H(a);a=L(a);var G=H(a);a=I(a);return b(c,d,e,g,h,G,a)};a.j=b;return a}(),e=function(e,k,l,p,q,s,B){switch(arguments.length){case 3:return d.call(this,e,k,l);case 4:return c.call(this,e,k,l,p);case 5:return b.call(this,e,k,l,p,q);case 6:return a.call(this,e,k,l,p,q,s);default:return g.j(e,k,l,p,q,s,N(arguments,6))}throw Error("Invalid arity: "+arguments.length);};e.n=6;e.m=g.m;e.e=d;e.t=c;e.N=b;e.ga=a;e.j=g.j;return e}();
function qd(a,b){this.w=a;this.h=b}function rd(a){return new qd(a,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null])}function sd(a){return new qd(a.w,ua(a.h))}function td(a){a=a.k;return 32>a?0:a-1>>>5<<5}function ud(a,b,c){for(;;){if(0===b)return c;var d=rd(a);d.h[0]=c;c=d;b-=5}}
var wd=function vd(b,c,d,e){var g=sd(d),h=b.k-1>>>c&31;5===c?g.h[h]=e:(d=d.h[h],b=null!=d?vd(b,c-5,d,e):ud(null,c-5,e),g.h[h]=b);return g};function xd(a,b){throw Error([w("No item "),w(a),w(" in vector of length "),w(b)].join(""));}function yd(a){var b=a.root;for(a=a.shift;;)if(0<a)a-=5,b=b.h[0];else return b.h}function zd(a,b){if(b>=td(a))return a.T;for(var c=a.root,d=a.shift;;)if(0<d)var e=d-5,c=c.h[b>>>d&31],d=e;else return c.h}function Ad(a,b){return 0<=b&&b<a.k?zd(a,b):xd(b,a.k)}
var Cd=function Bd(b,c,d,e,g){var h=sd(d);if(0===c)h.h[e&31]=g;else{var k=e>>>c&31;b=Bd(b,c-5,d.h[k],e,g);h.h[k]=b}return h},Ed=function Dd(b,c,d){var e=b.k-2>>>c&31;if(5<c){b=Dd(b,c-5,d.h[e]);if(null==b&&0===e)return null;d=sd(d);d.h[e]=b;return d}return 0===e?null:u?(d=sd(d),d.h[e]=null,d):null};function X(a,b,c,d,e,g){this.meta=a;this.k=b;this.shift=c;this.root=d;this.T=e;this.o=g;this.l=167668511;this.v=8196}f=X.prototype;f.toString=function(){return Cb(this)};
f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){return"number"===typeof b?x.e(this,b,c):c};f.R=function(a,b){return Ad(this,b)[b&31]};f.ea=function(a,b,c){return 0<=b&&b<this.k?zd(this,b)[b&31]:c};
f.rb=function(a,b,c){if(0<=b&&b<this.k)return td(this)<=b?(a=ua(this.T),a[b&31]=c,new X(this.meta,this.k,this.shift,this.root,a,null)):new X(this.meta,this.k,this.shift,Cd(this,this.shift,this.root,b,c),this.T,null);if(b===this.k)return Fa(this,c);if(u)throw Error([w("Index "),w(b),w(" out of bounds  [0,"),w(this.k),w("]")].join(""));return null};f.J=function(){return this.meta};f.aa=function(){return new X(this.meta,this.k,this.shift,this.root,this.T,this.o)};f.O=function(){return this.k};
f.qb=function(){return x.c(this,0)};f.yb=function(){return x.c(this,1)};f.Ba=function(){return 0<this.k?x.c(this,this.k-1):null};
f.Ca=function(){if(0===this.k)throw Error("Can't pop empty vector");if(1===this.k)return bb(Fd,this.meta);if(1<this.k-td(this))return new X(this.meta,this.k-1,this.shift,this.root,this.T.slice(0,-1),null);if(u){var a=zd(this,this.k-2),b=Ed(this,this.shift,this.root),b=null==b?Y:b,c=this.k-1;return 5<this.shift&&null==b.h[1]?new X(this.meta,c,this.shift-5,b.h[0],a,null):new X(this.meta,c,this.shift,b,a,null)}return null};f.Wa=function(){return 0<this.k?new Qb(this,this.k-1,null):null};
f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.La=function(){return new Gd(this.k,this.shift,Hd.f?Hd.f(this.root):Hd.call(null,this.root),Id.f?Id.f(this.T):Id.call(null,this.T))};f.Q=function(){return Ub(Fd,this.meta)};f.U=function(a,b){return Mb.c(this,b)};f.V=function(a,b,c){return Mb.e(this,b,c)};f.ya=function(a,b,c){if("number"===typeof b)return Xa(this,b,c);throw Error("Vector's key for assoc must be a number.");};
f.K=function(){return 0===this.k?null:32>=this.k?new Kb(this.T,0):u?Jd.t?Jd.t(this,yd(this),0,0):Jd.call(null,this,yd(this),0,0):null};f.L=function(a,b){return new X(b,this.k,this.shift,this.root,this.T,this.o)};
f.M=function(a,b){if(32>this.k-td(this)){for(var c=this.T.length,d=Array(c+1),e=0;;)if(e<c)d[e]=this.T[e],e+=1;else break;d[c]=b;return new X(this.meta,this.k+1,this.shift,this.root,d,null)}c=(d=this.k>>>5>1<<this.shift)?this.shift+5:this.shift;d?(d=rd(null),d.h[0]=this.root,e=ud(null,this.shift,new qd(null,this.T)),d.h[1]=e):d=wd(this,this.shift,this.root,new qd(null,this.T));return new X(this.meta,this.k+1,c,d,[b],null)};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.R(null,c);case 3:return this.ea(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.R(null,a)};f.c=function(a,b){return this.ea(null,a,b)};
var Y=new qd(null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]),Fd=new X(null,0,5,Y,[],0);function Kd(a){return ub(wa.e(tb,sb(Fd),a))}function Ld(a,b,c,d,e,g){this.H=a;this.node=b;this.i=c;this.G=d;this.meta=e;this.o=g;this.l=32243948;this.v=1536}f=Ld.prototype;f.toString=function(){return Cb(this)};
f.ba=function(){if(this.G+1<this.node.length){var a=Jd.t?Jd.t(this.H,this.node,this.i,this.G+1):Jd.call(null,this.H,this.node,this.i,this.G+1);return null==a?null:a}return Ab(this)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(Fd,this.meta)};f.U=function(a,b){return Mb.c(Md.e?Md.e(this.H,this.i+this.G,Q(this.H)):Md.call(null,this.H,this.i+this.G,Q(this.H)),b)};
f.V=function(a,b,c){return Mb.e(Md.e?Md.e(this.H,this.i+this.G,Q(this.H)):Md.call(null,this.H,this.i+this.G,Q(this.H)),b,c)};f.W=function(){return this.node[this.G]};f.$=function(){if(this.G+1<this.node.length){var a=Jd.t?Jd.t(this.H,this.node,this.i,this.G+1):Jd.call(null,this.H,this.node,this.i,this.G+1);return null==a?K:a}return zb(this)};f.K=function(){return this};f.ab=function(){return Hc.c(this.node,this.G)};
f.bb=function(){var a=this.i+this.node.length;return a<Ca(this.H)?Jd.t?Jd.t(this.H,zd(this.H,a),a,0):Jd.call(null,this.H,zd(this.H,a),a,0):K};f.L=function(a,b){return Jd.N?Jd.N(this.H,this.node,this.i,this.G,b):Jd.call(null,this.H,this.node,this.i,this.G,b)};f.M=function(a,b){return O(b,this)};f.$a=function(){var a=this.i+this.node.length;return a<Ca(this.H)?Jd.t?Jd.t(this.H,zd(this.H,a),a,0):Jd.call(null,this.H,zd(this.H,a),a,0):null};
var Jd=function(){function a(a,b,c,d,l){return new Ld(a,b,c,d,l,null)}function b(a,b,c,d){return new Ld(a,b,c,d,null,null)}function c(a,b,c){return new Ld(a,Ad(a,b),b,c,null,null)}var d=null,d=function(d,g,h,k,l){switch(arguments.length){case 3:return c.call(this,d,g,h);case 4:return b.call(this,d,g,h,k);case 5:return a.call(this,d,g,h,k,l)}throw Error("Invalid arity: "+arguments.length);};d.e=c;d.t=b;d.N=a;return d}();
function Nd(a,b,c,d,e){this.meta=a;this.da=b;this.start=c;this.end=d;this.o=e;this.l=166617887;this.v=8192}f=Nd.prototype;f.toString=function(){return Cb(this)};f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){return"number"===typeof b?x.e(this,b,c):c};f.R=function(a,b){return 0>b||this.end<=this.start+b?xd(b,this.end-this.start):x.c(this.da,this.start+b)};f.ea=function(a,b,c){return 0>b||this.end<=this.start+b?c:x.e(this.da,this.start+b,c)};
f.rb=function(a,b,c){var d=this,e=d.start+b;return Od.N?Od.N(d.meta,T.e(d.da,e,c),d.start,function(){var a=d.end,b=e+1;return a>b?a:b}(),null):Od.call(null,d.meta,T.e(d.da,e,c),d.start,function(){var a=d.end,b=e+1;return a>b?a:b}(),null)};f.J=function(){return this.meta};f.aa=function(){return new Nd(this.meta,this.da,this.start,this.end,this.o)};f.O=function(){return this.end-this.start};f.Ba=function(){return x.c(this.da,this.end-1)};
f.Ca=function(){if(this.start===this.end)throw Error("Can't pop empty vector");return Od.N?Od.N(this.meta,this.da,this.start,this.end-1,null):Od.call(null,this.meta,this.da,this.start,this.end-1,null)};f.Wa=function(){return this.start!==this.end?new Qb(this,this.end-this.start-1,null):null};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(Fd,this.meta)};f.U=function(a,b){return Mb.c(this,b)};
f.V=function(a,b,c){return Mb.e(this,b,c)};f.ya=function(a,b,c){if("number"===typeof b)return Xa(this,b,c);throw Error("Subvec's key for assoc must be a number.");};f.K=function(){var a=this;return function(b){return function d(e){return e===a.end?null:O(x.c(a.da,e),new W(null,function(){return function(){return d(e+1)}}(b),null,null))}}(this)(a.start)};f.L=function(a,b){return Od.N?Od.N(b,this.da,this.start,this.end,this.o):Od.call(null,b,this.da,this.start,this.end,this.o)};
f.M=function(a,b){return Od.N?Od.N(this.meta,Xa(this.da,this.end,b),this.start,this.end+1,null):Od.call(null,this.meta,Xa(this.da,this.end,b),this.start,this.end+1,null)};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.R(null,c);case 3:return this.ea(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.R(null,a)};
f.c=function(a,b){return this.ea(null,a,b)};function Od(a,b,c,d,e){for(;;)if(b instanceof Nd)c=b.start+c,d=b.start+d,b=b.da;else{var g=Q(b);if(0>c||0>d||c>g||d>g)throw Error("Index out of bounds");return new Nd(a,b,c,d,e)}}
var Md=function(){function a(a,b,c){return Od(null,a,b,c,null)}function b(a,b){return c.e(a,b,Q(a))}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}();function Hd(a){return new qd({},ua(a.h))}
function Id(a){var b=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];kc(a,0,b,0,a.length);return b}var Qd=function Pd(b,c,d,e){d=b.root.w===d.w?d:new qd(b.root.w,ua(d.h));var g=b.k-1>>>c&31;if(5===c)b=e;else{var h=d.h[g];b=null!=h?Pd(b,c-5,h,e):ud(b.root.w,c-5,e)}d.h[g]=b;return d};function Gd(a,b,c,d){this.k=a;this.shift=b;this.root=c;this.T=d;this.l=275;this.v=88}f=Gd.prototype;
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.D(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.D(null,a)};f.c=function(a,b){return this.F(null,a,b)};f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){return"number"===typeof b?x.e(this,b,c):c};
f.R=function(a,b){if(this.root.w)return Ad(this,b)[b&31];throw Error("nth after persistent!");};f.ea=function(a,b,c){return 0<=b&&b<this.k?x.c(this,b):c};f.O=function(){if(this.root.w)return this.k;throw Error("count after persistent!");};
f.Bb=function(a,b,c){var d=this;if(d.root.w){if(0<=b&&b<d.k)return td(this)<=b?d.T[b&31]=c:(a=function(){return function g(a,k){var l=d.root.w===k.w?k:new qd(d.root.w,ua(k.h));if(0===a)l.h[b&31]=c;else{var p=b>>>a&31,q=g(a-5,l.h[p]);l.h[p]=q}return l}}(this).call(null,d.shift,d.root),d.root=a),this;if(b===d.k)return tb(this,c);if(u)throw Error([w("Index "),w(b),w(" out of bounds for TransientVector of length"),w(d.k)].join(""));return null}throw Error("assoc! after persistent!");};
f.Na=function(a,b,c){if("number"===typeof b)return wb(this,b,c);throw Error("TransientVector's key for assoc! must be a number.");};
f.Oa=function(a,b){if(this.root.w){if(32>this.k-td(this))this.T[this.k&31]=b;else{var c=new qd(this.root.w,this.T),d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];d[0]=b;this.T=d;if(this.k>>>5>1<<this.shift){var d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],e=this.shift+
5;d[0]=this.root;d[1]=ud(this.root.w,this.shift,c);this.root=new qd(this.root.w,d);this.shift=e}else this.root=Qd(this,this.shift,this.root,c)}this.k+=1;return this}throw Error("conj! after persistent!");};f.Pa=function(){if(this.root.w){this.root.w=null;var a=this.k-td(this),b=Array(a);kc(this.T,0,b,0,a);return new X(null,this.k,this.shift,this.root,b,null)}throw Error("persistent! called twice");};function Rd(){this.v=0;this.l=2097152}Rd.prototype.A=function(){return!1};var Sd=new Rd;
function Td(a,b){return nc(gc(b)?Q(a)===Q(b)?Tc(Vc,Xc.c(function(a){return D.c(S.e(b,H(a),Sd),H(L(a)))},a)):null:null)}
function Ud(a,b){var c=a.h;if(b instanceof V)a:{for(var d=c.length,e=b.sa,g=0;;){if(d<=g){c=-1;break a}var h=c[g];if(h instanceof V&&e===h.sa){c=g;break a}if(u)g+=2;else{c=null;break a}}c=void 0}else if("string"==typeof b||"number"===typeof b)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(b===c[e]){c=e;break a}if(u)e+=2;else{c=null;break a}}c=void 0}else if(b instanceof Gb)a:{d=c.length;e=b.wa;for(g=0;;){if(d<=g){c=-1;break a}h=c[g];if(h instanceof Gb&&e===h.wa){c=g;break a}if(u)g+=2;else{c=null;
break a}}c=void 0}else if(null==b)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(null==c[e]){c=e;break a}if(u)e+=2;else{c=null;break a}}c=void 0}else if(u)a:{d=c.length;for(e=0;;){if(d<=e){c=-1;break a}if(D.c(b,c[e])){c=e;break a}if(u)e+=2;else{c=null;break a}}c=void 0}else c=null;return c}function Vd(a,b,c){this.h=a;this.i=b;this.fa=c;this.v=0;this.l=32374990}f=Vd.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.fa};
f.ba=function(){return this.i<this.h.length-2?new Vd(this.h,this.i+2,this.fa):null};f.O=function(){return(this.h.length-this.i)/2};f.I=function(){return Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.fa)};f.U=function(a,b){return P.c(b,this)};f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){return new X(null,2,5,Y,[this.h[this.i],this.h[this.i+1]],null)};f.$=function(){return this.i<this.h.length-2?new Vd(this.h,this.i+2,this.fa):K};f.K=function(){return this};
f.L=function(a,b){return new Vd(this.h,this.i,b)};f.M=function(a,b){return O(b,this)};function n(a,b,c,d){this.meta=a;this.k=b;this.h=c;this.o=d;this.l=16123663;this.v=8196}f=n.prototype;f.toString=function(){return Cb(this)};f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){a=Ud(this,b);return-1===a?c:this.h[a+1]};f.J=function(){return this.meta};f.aa=function(){return new n(this.meta,this.k,this.h,this.o)};f.O=function(){return this.k};
f.I=function(){var a=this.o;return null!=a?a:this.o=a=uc(this)};f.A=function(a,b){return Td(this,b)};f.La=function(){return new Wd({},this.h.length,ua(this.h))};f.Q=function(){return bb(Xd,this.meta)};f.Va=function(a,b){if(0<=Ud(this,b)){var c=this.h.length,d=c-2;if(0===d)return Da(this);for(var d=Array(d),e=0,g=0;;){if(e>=c)return new n(this.meta,this.k-1,d,null);if(D.c(b,this.h[e]))e+=2;else if(u)d[g]=this.h[e],d[g+1]=this.h[e+1],g+=2,e+=2;else return null}}else return this};
f.ya=function(a,b,c){a=Ud(this,b);if(-1===a){if(this.k<Yd){a=this.h;for(var d=a.length,e=Array(d+2),g=0;;)if(g<d)e[g]=a[g],g+=1;else break;e[d]=b;e[d+1]=c;return new n(this.meta,this.k+1,e,null)}return bb(Ma(kd(Zd,this),b,c),this.meta)}return c===this.h[a+1]?this:u?(b=ua(this.h),b[a+1]=c,new n(this.meta,this.k,b,null)):null};f.Ja=function(a,b){return-1!==Ud(this,b)};f.K=function(){return 0<=this.h.length-2?new Vd(this.h,0,null):null};f.L=function(a,b){return new n(b,this.k,this.h,this.o)};
f.M=function(a,b){return hc(b)?Ma(this,x.c(b,0),x.c(b,1)):wa.e(Fa,this,b)};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.D(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.D(null,a)};f.c=function(a,b){return this.F(null,a,b)};var Xd=new n(null,0,[],null),Yd=8;
function Wd(a,b,c){this.Da=a;this.pa=b;this.h=c;this.v=56;this.l=258}f=Wd.prototype;f.Na=function(a,b,c){if(r(this.Da)){a=Ud(this,b);if(-1===a)return this.pa+2<=2*Yd?(this.pa+=2,this.h.push(b),this.h.push(c),this):Qc.e(ae.c?ae.c(this.pa,this.h):ae.call(null,this.pa,this.h),b,c);c!==this.h[a+1]&&(this.h[a+1]=c);return this}throw Error("assoc! after persistent!");};
f.Oa=function(a,b){if(r(this.Da)){if(b?b.l&2048||b.Wb||(b.l?0:t(Pa,b)):t(Pa,b))return vb(this,vc.f?vc.f(b):vc.call(null,b),wc.f?wc.f(b):wc.call(null,b));for(var c=F(b),d=this;;){var e=H(c);if(r(e))c=L(c),d=vb(d,vc.f?vc.f(e):vc.call(null,e),wc.f?wc.f(e):wc.call(null,e));else return d}}else throw Error("conj! after persistent!");};f.Pa=function(){if(r(this.Da))return this.Da=!1,new n(null,qc((this.pa-this.pa%2)/2),this.h,null);throw Error("persistent! called twice");};
f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){if(r(this.Da))return a=Ud(this,b),-1===a?c:this.h[a+1];throw Error("lookup after persistent!");};f.O=function(){if(r(this.Da))return qc((this.pa-this.pa%2)/2);throw Error("count after persistent!");};function ae(a,b){for(var c=sb(Zd),d=0;;)if(d<a)c=Qc.e(c,b[d],b[d+1]),d+=2;else return c}function be(){this.na=!1}function ce(a,b){return a===b?!0:a===b||a instanceof V&&b instanceof V&&a.sa===b.sa?!0:u?D.c(a,b):null}
var de=function(){function a(a,b,c,h,k){a=ua(a);a[b]=c;a[h]=k;return a}function b(a,b,c){a=ua(a);a[b]=c;return a}var c=null,c=function(c,e,g,h,k){switch(arguments.length){case 3:return b.call(this,c,e,g);case 5:return a.call(this,c,e,g,h,k)}throw Error("Invalid arity: "+arguments.length);};c.e=b;c.N=a;return c}();function ee(a,b){var c=Array(a.length-2);kc(a,0,c,0,2*b);kc(a,2*(b+1),c,2*b,c.length-2*b);return c}
var fe=function(){function a(a,b,c,h,k,l){a=a.Ea(b);a.h[c]=h;a.h[k]=l;return a}function b(a,b,c,h){a=a.Ea(b);a.h[c]=h;return a}var c=null,c=function(c,e,g,h,k,l){switch(arguments.length){case 4:return b.call(this,c,e,g,h);case 6:return a.call(this,c,e,g,h,k,l)}throw Error("Invalid arity: "+arguments.length);};c.t=b;c.ga=a;return c}();function ge(a,b,c){this.w=a;this.B=b;this.h=c}f=ge.prototype;
f.Ea=function(a){if(a===this.w)return this;var b=rc(this.B),c=Array(0>b?4:2*(b+1));kc(this.h,0,c,0,2*b);return new ge(a,this.B,c)};f.Qa=function(){return he.f?he.f(this.h):he.call(null,this.h)};f.ua=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.B&e))return d;var g=rc(this.B&e-1),e=this.h[2*g],g=this.h[2*g+1];return null==e?g.ua(a+5,b,c,d):ce(c,e)?g:u?d:null};
f.ia=function(a,b,c,d,e,g){var h=1<<(c>>>b&31),k=rc(this.B&h-1);if(0===(this.B&h)){var l=rc(this.B);if(2*l<this.h.length){a=this.Ea(a);b=a.h;g.na=!0;a:for(c=2*(l-k),g=2*k+(c-1),l=2*(k+1)+(c-1);;){if(0===c)break a;b[l]=b[g];l-=1;c-=1;g-=1}b[2*k]=d;b[2*k+1]=e;a.B|=h;return a}if(16<=l){k=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];k[c>>>b&31]=ie.ia(a,b+5,c,d,e,g);for(e=d=0;;)if(32>d)0!==
(this.B>>>d&1)&&(k[d]=null!=this.h[e]?ie.ia(a,b+5,E(this.h[e]),this.h[e],this.h[e+1],g):this.h[e+1],e+=2),d+=1;else break;return new je(a,l+1,k)}return u?(b=Array(2*(l+4)),kc(this.h,0,b,0,2*k),b[2*k]=d,b[2*k+1]=e,kc(this.h,2*k,b,2*(k+1),2*(l-k)),g.na=!0,a=this.Ea(a),a.h=b,a.B|=h,a):null}l=this.h[2*k];h=this.h[2*k+1];return null==l?(l=h.ia(a,b+5,c,d,e,g),l===h?this:fe.t(this,a,2*k+1,l)):ce(d,l)?e===h?this:fe.t(this,a,2*k+1,e):u?(g.na=!0,fe.ga(this,a,2*k,null,2*k+1,ke.Aa?ke.Aa(a,b+5,l,h,c,d,e):ke.call(null,
a,b+5,l,h,c,d,e))):null};
f.ha=function(a,b,c,d,e){var g=1<<(b>>>a&31),h=rc(this.B&g-1);if(0===(this.B&g)){var k=rc(this.B);if(16<=k){h=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];h[b>>>a&31]=ie.ha(a+5,b,c,d,e);for(d=c=0;;)if(32>c)0!==(this.B>>>c&1)&&(h[c]=null!=this.h[d]?ie.ha(a+5,E(this.h[d]),this.h[d],this.h[d+1],e):this.h[d+1],d+=2),c+=1;else break;return new je(null,k+1,h)}a=Array(2*(k+1));kc(this.h,0,
a,0,2*h);a[2*h]=c;a[2*h+1]=d;kc(this.h,2*h,a,2*(h+1),2*(k-h));e.na=!0;return new ge(null,this.B|g,a)}k=this.h[2*h];g=this.h[2*h+1];return null==k?(k=g.ha(a+5,b,c,d,e),k===g?this:new ge(null,this.B,de.e(this.h,2*h+1,k))):ce(c,k)?d===g?this:new ge(null,this.B,de.e(this.h,2*h+1,d)):u?(e.na=!0,new ge(null,this.B,de.N(this.h,2*h,null,2*h+1,ke.ga?ke.ga(a+5,k,g,b,c,d):ke.call(null,a+5,k,g,b,c,d)))):null};
f.Ra=function(a,b,c){var d=1<<(b>>>a&31);if(0===(this.B&d))return this;var e=rc(this.B&d-1),g=this.h[2*e],h=this.h[2*e+1];return null==g?(a=h.Ra(a+5,b,c),a===h?this:null!=a?new ge(null,this.B,de.e(this.h,2*e+1,a)):this.B===d?null:u?new ge(null,this.B^d,ee(this.h,e)):null):ce(c,g)?new ge(null,this.B^d,ee(this.h,e)):u?this:null};var ie=new ge(null,0,[]);function je(a,b,c){this.w=a;this.k=b;this.h=c}f=je.prototype;f.Ea=function(a){return a===this.w?this:new je(a,this.k,ua(this.h))};
f.Qa=function(){return le.f?le.f(this.h):le.call(null,this.h)};f.ua=function(a,b,c,d){var e=this.h[b>>>a&31];return null!=e?e.ua(a+5,b,c,d):d};f.ia=function(a,b,c,d,e,g){var h=c>>>b&31,k=this.h[h];if(null==k)return a=fe.t(this,a,h,ie.ia(a,b+5,c,d,e,g)),a.k+=1,a;b=k.ia(a,b+5,c,d,e,g);return b===k?this:fe.t(this,a,h,b)};
f.ha=function(a,b,c,d,e){var g=b>>>a&31,h=this.h[g];if(null==h)return new je(null,this.k+1,de.e(this.h,g,ie.ha(a+5,b,c,d,e)));a=h.ha(a+5,b,c,d,e);return a===h?this:new je(null,this.k,de.e(this.h,g,a))};
f.Ra=function(a,b,c){var d=b>>>a&31,e=this.h[d];if(null!=e){a=e.Ra(a+5,b,c);if(a===e)d=this;else if(null==a)if(8>=this.k)a:{e=this.h;a=2*(this.k-1);b=Array(a);c=0;for(var g=1,h=0;;)if(c<a)c!==d&&null!=e[c]&&(b[g]=e[c],g+=2,h|=1<<c),c+=1;else{d=new ge(null,h,b);break a}d=void 0}else d=new je(null,this.k-1,de.e(this.h,d,a));else d=u?new je(null,this.k,de.e(this.h,d,a)):null;return d}return this};function me(a,b,c){b*=2;for(var d=0;;)if(d<b){if(ce(c,a[d]))return d;d+=2}else return-1}
function ne(a,b,c,d){this.w=a;this.oa=b;this.k=c;this.h=d}f=ne.prototype;f.Ea=function(a){if(a===this.w)return this;var b=Array(2*(this.k+1));kc(this.h,0,b,0,2*this.k);return new ne(a,this.oa,this.k,b)};f.Qa=function(){return he.f?he.f(this.h):he.call(null,this.h)};f.ua=function(a,b,c,d){a=me(this.h,this.k,c);return 0>a?d:ce(c,this.h[a])?this.h[a+1]:u?d:null};
f.ia=function(a,b,c,d,e,g){if(c===this.oa){b=me(this.h,this.k,d);if(-1===b){if(this.h.length>2*this.k)return a=fe.ga(this,a,2*this.k,d,2*this.k+1,e),g.na=!0,a.k+=1,a;c=this.h.length;b=Array(c+2);kc(this.h,0,b,0,c);b[c]=d;b[c+1]=e;g.na=!0;g=this.k+1;a===this.w?(this.h=b,this.k=g,a=this):a=new ne(this.w,this.oa,g,b);return a}return this.h[b+1]===e?this:fe.t(this,a,b+1,e)}return(new ge(a,1<<(this.oa>>>b&31),[null,this,null,null])).ia(a,b,c,d,e,g)};
f.ha=function(a,b,c,d,e){return b===this.oa?(a=me(this.h,this.k,c),-1===a?(a=2*this.k,b=Array(a+2),kc(this.h,0,b,0,a),b[a]=c,b[a+1]=d,e.na=!0,new ne(null,this.oa,this.k+1,b)):D.c(this.h[a],d)?this:new ne(null,this.oa,this.k,de.e(this.h,a+1,d))):(new ge(null,1<<(this.oa>>>a&31),[null,this])).ha(a,b,c,d,e)};f.Ra=function(a,b,c){a=me(this.h,this.k,c);return-1===a?this:1===this.k?null:u?new ne(null,this.oa,this.k-1,ee(this.h,qc((a-a%2)/2))):null};
var ke=function(){function a(a,b,c,h,k,l,p){var q=E(c);if(q===k)return new ne(null,q,2,[c,h,l,p]);var s=new be;return ie.ia(a,b,q,c,h,s).ia(a,b,k,l,p,s)}function b(a,b,c,h,k,l){var p=E(b);if(p===h)return new ne(null,p,2,[b,c,k,l]);var q=new be;return ie.ha(a,p,b,c,q).ha(a,h,k,l,q)}var c=null,c=function(c,e,g,h,k,l,p){switch(arguments.length){case 6:return b.call(this,c,e,g,h,k,l);case 7:return a.call(this,c,e,g,h,k,l,p)}throw Error("Invalid arity: "+arguments.length);};c.ga=b;c.Aa=a;return c}();
function oe(a,b,c,d,e){this.meta=a;this.ja=b;this.i=c;this.s=d;this.o=e;this.v=0;this.l=32374860}f=oe.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.meta};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.meta)};f.U=function(a,b){return P.c(b,this)};f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){return null==this.s?new X(null,2,5,Y,[this.ja[this.i],this.ja[this.i+1]],null):H(this.s)};
f.$=function(){return null==this.s?he.e?he.e(this.ja,this.i+2,null):he.call(null,this.ja,this.i+2,null):he.e?he.e(this.ja,this.i,L(this.s)):he.call(null,this.ja,this.i,L(this.s))};f.K=function(){return this};f.L=function(a,b){return new oe(b,this.ja,this.i,this.s,this.o)};f.M=function(a,b){return O(b,this)};
var he=function(){function a(a,b,c){if(null==c)for(c=a.length;;)if(b<c){if(null!=a[b])return new oe(null,a,b,null,null);var h=a[b+1];if(r(h)&&(h=h.Qa(),r(h)))return new oe(null,a,b+2,h,null);b+=2}else return null;else return new oe(null,a,b,c,null)}function b(a){return c.e(a,0,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 1:return b.call(this,c);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.e=a;return c}();
function pe(a,b,c,d,e){this.meta=a;this.ja=b;this.i=c;this.s=d;this.o=e;this.v=0;this.l=32374860}f=pe.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.meta};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.meta)};f.U=function(a,b){return P.c(b,this)};f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){return H(this.s)};
f.$=function(){return le.t?le.t(null,this.ja,this.i,L(this.s)):le.call(null,null,this.ja,this.i,L(this.s))};f.K=function(){return this};f.L=function(a,b){return new pe(b,this.ja,this.i,this.s,this.o)};f.M=function(a,b){return O(b,this)};
var le=function(){function a(a,b,c,h){if(null==h)for(h=b.length;;)if(c<h){var k=b[c];if(r(k)&&(k=k.Qa(),r(k)))return new pe(a,b,c+1,k,null);c+=1}else return null;else return new pe(a,b,c,h,null)}function b(a){return c.t(null,a,0,null)}var c=null,c=function(c,e,g,h){switch(arguments.length){case 1:return b.call(this,c);case 4:return a.call(this,c,e,g,h)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.t=a;return c}();
function qe(a,b,c,d,e,g){this.meta=a;this.k=b;this.root=c;this.X=d;this.ca=e;this.o=g;this.l=16123663;this.v=8196}f=qe.prototype;f.toString=function(){return Cb(this)};f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){return null==b?this.X?this.ca:c:null==this.root?c:u?this.root.ua(0,E(b),b,c):null};f.J=function(){return this.meta};f.aa=function(){return new qe(this.meta,this.k,this.root,this.X,this.ca,this.o)};f.O=function(){return this.k};
f.I=function(){var a=this.o;return null!=a?a:this.o=a=uc(this)};f.A=function(a,b){return Td(this,b)};f.La=function(){return new re({},this.root,this.k,this.X,this.ca)};f.Q=function(){return bb(Zd,this.meta)};f.Va=function(a,b){if(null==b)return this.X?new qe(this.meta,this.k-1,this.root,!1,null,null):this;if(null==this.root)return this;if(u){var c=this.root.Ra(0,E(b),b);return c===this.root?this:new qe(this.meta,this.k-1,c,this.X,this.ca,null)}return null};
f.ya=function(a,b,c){if(null==b)return this.X&&c===this.ca?this:new qe(this.meta,this.X?this.k:this.k+1,this.root,!0,c,null);a=new be;b=(null==this.root?ie:this.root).ha(0,E(b),b,c,a);return b===this.root?this:new qe(this.meta,a.na?this.k+1:this.k,b,this.X,this.ca,null)};f.Ja=function(a,b){return null==b?this.X:null==this.root?!1:u?this.root.ua(0,E(b),b,lc)!==lc:null};f.K=function(){if(0<this.k){var a=null!=this.root?this.root.Qa():null;return this.X?O(new X(null,2,5,Y,[null,this.ca],null),a):a}return null};
f.L=function(a,b){return new qe(b,this.k,this.root,this.X,this.ca,this.o)};f.M=function(a,b){return hc(b)?Ma(this,x.c(b,0),x.c(b,1)):wa.e(Fa,this,b)};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.D(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.D(null,a)};f.c=function(a,b){return this.F(null,a,b)};
var Zd=new qe(null,0,null,!1,null,0);function Xb(a,b){for(var c=a.length,d=0,e=sb(Zd);;)if(d<c)var g=d+1,e=e.Na(null,a[d],b[d]),d=g;else return ub(e)}function re(a,b,c,d,e){this.w=a;this.root=b;this.count=c;this.X=d;this.ca=e;this.v=56;this.l=258}f=re.prototype;f.Na=function(a,b,c){return se(this,b,c)};
f.Oa=function(a,b){var c;a:{if(this.w){if(b?b.l&2048||b.Wb||(b.l?0:t(Pa,b)):t(Pa,b)){c=se(this,vc.f?vc.f(b):vc.call(null,b),wc.f?wc.f(b):wc.call(null,b));break a}c=F(b);for(var d=this;;){var e=H(c);if(r(e))c=L(c),d=se(d,vc.f?vc.f(e):vc.call(null,e),wc.f?wc.f(e):wc.call(null,e));else{c=d;break a}}}else throw Error("conj! after persistent");c=void 0}return c};
f.Pa=function(){var a;if(this.w)this.w=null,a=new qe(null,this.count,this.root,this.X,this.ca,null);else throw Error("persistent! called twice");return a};f.D=function(a,b){return null==b?this.X?this.ca:null:null==this.root?null:this.root.ua(0,E(b),b)};f.F=function(a,b,c){return null==b?this.X?this.ca:c:null==this.root?c:this.root.ua(0,E(b),b,c)};f.O=function(){if(this.w)return this.count;throw Error("count after persistent!");};
function se(a,b,c){if(a.w){if(null==b)a.ca!==c&&(a.ca=c),a.X||(a.count+=1,a.X=!0);else{var d=new be;b=(null==a.root?ie:a.root).ia(a.w,0,E(b),b,c,d);b!==a.root&&(a.root=b);d.na&&(a.count+=1)}return a}throw Error("assoc! after persistent!");}
var te=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){a=F(a);for(var b=sb(Zd);;)if(a){var e=L(L(a)),b=Qc.e(b,H(a),H(L(a)));a=e}else return ub(b)}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}();function ue(a,b){this.va=a;this.fa=b;this.v=0;this.l=32374988}f=ue.prototype;f.toString=function(){return Cb(this)};f.J=function(){return this.fa};
f.ba=function(){var a=this.va,a=(a?a.l&128||a.zb||(a.l?0:t(Ja,a)):t(Ja,a))?this.va.ba(null):L(this.va);return null==a?null:new ue(a,this.fa)};f.I=function(){return Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.fa)};f.U=function(a,b){return P.c(b,this)};f.V=function(a,b,c){return P.e(b,c,this)};f.W=function(){return this.va.W(null).qb()};
f.$=function(){var a=this.va,a=(a?a.l&128||a.zb||(a.l?0:t(Ja,a)):t(Ja,a))?this.va.ba(null):L(this.va);return null!=a?new ue(a,this.fa):K};f.K=function(){return this};f.L=function(a,b){return new ue(this.va,b)};f.M=function(a,b){return O(b,this)};function ve(a){return(a=F(a))?new ue(a,null):null}function vc(a){return Qa(a)}function wc(a){return Ra(a)}
var we=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return r(Uc(a))?wa.c(function(a,b){return Vb.c(r(a)?a:Xd,b)},a):null}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}();function xe(a,b,c){this.meta=a;this.ta=b;this.o=c;this.l=15077647;this.v=8196}f=xe.prototype;f.toString=function(){return Cb(this)};f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){return La(this.ta,b)?b:c};
f.J=function(){return this.meta};f.aa=function(){return new xe(this.meta,this.ta,this.o)};f.O=function(){return Ca(this.ta)};f.I=function(){var a=this.o;if(null!=a)return a;a:{for(var a=0,b=F(this);;)if(b)var c=H(b),a=(a+E(c))%4503599627370496,b=L(b);else break a;a=void 0}return this.o=a};f.A=function(a,b){return(null==b?!1:b?b.l&4096||b.Mc?!0:b.l?!1:t(Sa,b):t(Sa,b))&&Q(this)===Q(b)&&Tc(function(a){return function(b){return oc(a,b)}}(this),b)};f.La=function(){return new ye(sb(this.ta))};
f.Q=function(){return Ub(ze,this.meta)};f.Ab=function(a,b){return new xe(this.meta,Oa(this.ta,b),null)};f.K=function(){return ve(this.ta)};f.L=function(a,b){return new xe(b,this.ta,this.o)};f.M=function(a,b){return new xe(this.meta,T.e(this.ta,b,null),null)};f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.D(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();
f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.D(null,a)};f.c=function(a,b){return this.F(null,a,b)};var ze=new xe(null,Xd,0);function ye(a){this.qa=a;this.l=259;this.v=136}f=ye.prototype;f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return A.e(this.qa,c,lc)===lc?null:c;case 3:return A.e(this.qa,c,lc)===lc?d:c}throw Error("Invalid arity: "+arguments.length);}}();
f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return A.e(this.qa,a,lc)===lc?null:a};f.c=function(a,b){return A.e(this.qa,a,lc)===lc?b:a};f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){return A.e(this.qa,b,lc)===lc?c:b};f.O=function(){return Q(this.qa)};f.Oa=function(a,b){this.qa=Qc.e(this.qa,b,null);return this};f.Pa=function(){return new xe(null,ub(this.qa),null)};
function Bc(a){if(a&&(a.v&4096||a.Yb))return a.name;if("string"===typeof a)return a;throw Error([w("Doesn't support name: "),w(a)].join(""));}function Ae(a,b){for(var c=sb(Xd),d=F(a),e=F(b);;)if(d&&e)c=Qc.e(c,H(d),H(e)),d=L(d),e=L(e);else return ub(c)}function Be(a,b,c,d,e){this.meta=a;this.start=b;this.end=c;this.step=d;this.o=e;this.l=32375006;this.v=8192}f=Be.prototype;f.toString=function(){return Cb(this)};
f.R=function(a,b){if(b<Ca(this))return this.start+b*this.step;if(this.start>this.end&&0===this.step)return this.start;throw Error("Index out of bounds");};f.ea=function(a,b,c){return b<Ca(this)?this.start+b*this.step:this.start>this.end&&0===this.step?this.start:c};f.J=function(){return this.meta};f.aa=function(){return new Be(this.meta,this.start,this.end,this.step,this.o)};
f.ba=function(){return 0<this.step?this.start+this.step<this.end?new Be(this.meta,this.start+this.step,this.end,this.step,null):null:this.start+this.step>this.end?new Be(this.meta,this.start+this.step,this.end,this.step,null):null};f.O=function(){return ra(ib(this))?0:Math.ceil((this.end-this.start)/this.step)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=Rb(this)};f.A=function(a,b){return Sb(this,b)};f.Q=function(){return Ub(K,this.meta)};f.U=function(a,b){return Mb.c(this,b)};
f.V=function(a,b,c){return Mb.e(this,b,c)};f.W=function(){return null==ib(this)?null:this.start};f.$=function(){return null!=ib(this)?new Be(this.meta,this.start+this.step,this.end,this.step,null):K};f.K=function(){return 0<this.step?this.start<this.end?this:null:this.start>this.end?this:null};f.L=function(a,b){return new Be(b,this.start,this.end,this.step,this.o)};f.M=function(a,b){return O(b,this)};
var Ce=function(){function a(a,b,c){return new Be(null,a,b,c,null)}function b(a,b){return e.e(a,b,1)}function c(a){return e.e(0,a,1)}function d(){return e.e(0,Number.MAX_VALUE,1)}var e=null,e=function(e,h,k){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,e);case 2:return b.call(this,e,h);case 3:return a.call(this,e,h,k)}throw Error("Invalid arity: "+arguments.length);};e.P=d;e.f=c;e.c=b;e.e=a;return e}();
function De(a,b,c,d,e,g,h){var k=ia;try{ia=null==ia?null:ia-1;if(null!=ia&&0>ia)return C(a,"#");C(a,c);F(h)&&(b.e?b.e(H(h),a,g):b.call(null,H(h),a,g));for(var l=L(h),p=pa.f(g);l&&(null==p||0!==p);){C(a,d);b.e?b.e(H(l),a,g):b.call(null,H(l),a,g);var q=L(l);c=p-1;l=q;p=c}r(pa.f(g))&&(C(a,d),b.e?b.e("...",a,g):b.call(null,"...",a,g));return C(a,e)}finally{ia=k}}
var Ee=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){for(var e=F(b),g=null,h=0,k=0;;)if(k<h){var l=g.R(null,k);C(a,l);k+=1}else if(e=F(e))g=e,ic(g)?(e=yb(g),h=zb(g),g=e,l=Q(e),e=h,h=l):(l=H(g),C(a,l),e=L(g),g=null,h=0),k=0;else return null}a.n=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}(),Fe={'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"};
function Ge(a){return[w('"'),w(a.replace(RegExp('[\\\\"\b\f\n\r\t]',"g"),function(a){return Fe[a]})),w('"')].join("")}
var Je=function He(b,c,d){if(null==b)return C(c,"nil");if(void 0===b)return C(c,"#\x3cundefined\x3e");if(u){r(function(){var c=S.c(d,na);return r(c)?(c=b?b.l&131072||b.Xb?!0:b.l?!1:t(Za,b):t(Za,b))?ac(b):c:c}())&&(C(c,"^"),He(ac(b),c,d),C(c," "));if(null==b)return C(c,"nil");if(b.tb)return b.Gb(b,c,d);if(b&&(b.l&2147483648||b.S))return b.C(null,c,d);if(sa(b)===Boolean||"number"===typeof b)return C(c,""+w(b));if(null!=b&&b.constructor===Object)return C(c,"#js "),Ie.t?Ie.t(Xc.c(function(c){return new X(null,
2,5,Y,[Cc.f(c),b[c]],null)},jc(b)),He,c,d):Ie.call(null,Xc.c(function(c){return new X(null,2,5,Y,[Cc.f(c),b[c]],null)},jc(b)),He,c,d);if(b instanceof Array)return De(c,He,"#js ["," ","]",d,b);if("string"==typeof b)return r(ma.f(d))?C(c,Ge(b)):C(c,b);if(Zb(b))return Ee.j(c,N(["#\x3c",""+w(b),"\x3e"],0));if(b instanceof Date){var e=function(b,c){for(var d=""+w(b);;)if(Q(d)<c)d=[w("0"),w(d)].join("");else return d};return Ee.j(c,N(['#inst "',""+w(b.getUTCFullYear()),"-",e(b.getUTCMonth()+1,2),"-",e(b.getUTCDate(),
2),"T",e(b.getUTCHours(),2),":",e(b.getUTCMinutes(),2),":",e(b.getUTCSeconds(),2),".",e(b.getUTCMilliseconds(),3),"-",'00:00"'],0))}return b instanceof RegExp?Ee.j(c,N(['#"',b.source,'"'],0)):(b?b.l&2147483648||b.S||(b.l?0:t(nb,b)):t(nb,b))?ob(b,c,d):u?Ee.j(c,N(["#\x3c",""+w(b),"\x3e"],0)):null}return null},Ke=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){var b;if(ec(a))b="";else{b=w;var e=ja(),g=new ga;
a:{var h=new Bb(g);Je(H(a),h,e);a=F(L(a));for(var k=null,l=0,p=0;;)if(p<l){var q=k.R(null,p);C(h," ");Je(q,h,e);p+=1}else if(a=F(a))k=a,ic(k)?(a=yb(k),l=zb(k),k=a,q=Q(a),a=l,l=q):(q=H(k),C(h," "),Je(q,h,e),a=L(k),k=null,l=0),p=0;else break a}b=""+b(g)}return b}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}();function Ie(a,b,c,d){return De(c,function(a,c,d){b.e?b.e(Qa(a),c,d):b.call(null,Qa(a),c,d);C(c," ");return b.e?b.e(Ra(a),c,d):b.call(null,Ra(a),c,d)},"{",", ","}",d,F(a))}
Kb.prototype.S=!0;Kb.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};W.prototype.S=!0;W.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};oe.prototype.S=!0;oe.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};Vd.prototype.S=!0;Vd.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};Ld.prototype.S=!0;Ld.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};Ac.prototype.S=!0;
Ac.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};Qb.prototype.S=!0;Qb.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};qe.prototype.S=!0;qe.prototype.C=function(a,b,c){return Ie(this,Je,b,c)};pe.prototype.S=!0;pe.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};Nd.prototype.S=!0;Nd.prototype.C=function(a,b,c){return De(b,Je,"["," ","]",c,this)};xe.prototype.S=!0;xe.prototype.C=function(a,b,c){return De(b,Je,"#{"," ","}",c,this)};Ic.prototype.S=!0;
Ic.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};X.prototype.S=!0;X.prototype.C=function(a,b,c){return De(b,Je,"["," ","]",c,this)};yc.prototype.S=!0;yc.prototype.C=function(a,b){return C(b,"()")};n.prototype.S=!0;n.prototype.C=function(a,b,c){return Ie(this,Je,b,c)};Be.prototype.S=!0;Be.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};ue.prototype.S=!0;ue.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};xc.prototype.S=!0;
xc.prototype.C=function(a,b,c){return De(b,Je,"("," ",")",c,this)};X.prototype.Ta=!0;X.prototype.Ua=function(a,b){return pc.c(this,b)};Nd.prototype.Ta=!0;Nd.prototype.Ua=function(a,b){return pc.c(this,b)};V.prototype.Ta=!0;V.prototype.Ua=function(a,b){return Db(this,b)};Gb.prototype.Ta=!0;Gb.prototype.Ua=function(a,b){return Db(this,b)};var Le={};function Me(a,b){if(a?a.$b:a)return a.$b(a,b);var c;c=Me[m(null==a?null:a)];if(!c&&(c=Me._,!c))throw v("IReset.-reset!",a);return c.call(null,a,b)}
var Ne=function(){function a(a,b,c,d,e){if(a?a.ec:a)return a.ec(a,b,c,d,e);var q;q=Ne[m(null==a?null:a)];if(!q&&(q=Ne._,!q))throw v("ISwap.-swap!",a);return q.call(null,a,b,c,d,e)}function b(a,b,c,d){if(a?a.dc:a)return a.dc(a,b,c,d);var e;e=Ne[m(null==a?null:a)];if(!e&&(e=Ne._,!e))throw v("ISwap.-swap!",a);return e.call(null,a,b,c,d)}function c(a,b,c){if(a?a.cc:a)return a.cc(a,b,c);var d;d=Ne[m(null==a?null:a)];if(!d&&(d=Ne._,!d))throw v("ISwap.-swap!",a);return d.call(null,a,b,c)}function d(a,b){if(a?
a.bc:a)return a.bc(a,b);var c;c=Ne[m(null==a?null:a)];if(!c&&(c=Ne._,!c))throw v("ISwap.-swap!",a);return c.call(null,a,b)}var e=null,e=function(e,h,k,l,p){switch(arguments.length){case 2:return d.call(this,e,h);case 3:return c.call(this,e,h,k);case 4:return b.call(this,e,h,k,l);case 5:return a.call(this,e,h,k,l,p)}throw Error("Invalid arity: "+arguments.length);};e.c=d;e.e=c;e.t=b;e.N=a;return e}();function Oe(a,b,c,d){this.state=a;this.meta=b;this.zc=c;this.Ga=d;this.l=2153938944;this.v=16386}
f=Oe.prototype;f.I=function(){return ba(this)};f.Db=function(a,b,c){a=F(this.Ga);for(var d=null,e=0,g=0;;)if(g<e){var h=d.R(null,g),k=R.e(h,0,null),h=R.e(h,1,null);h.t?h.t(k,this,b,c):h.call(null,k,this,b,c);g+=1}else if(a=F(a))ic(a)?(d=yb(a),a=zb(a),k=d,e=Q(d),d=k):(d=H(a),k=R.e(d,0,null),h=R.e(d,1,null),h.t?h.t(k,this,b,c):h.call(null,k,this,b,c),a=L(a),d=null,e=0),g=0;else return null};f.Cb=function(a,b,c){return this.Ga=T.e(this.Ga,b,c)};f.Eb=function(a,b){return this.Ga=Yb.c(this.Ga,b)};
f.C=function(a,b,c){C(b,"#\x3cAtom: ");Je(this.state,b,c);return C(b,"\x3e")};f.J=function(){return this.meta};f.Ka=function(){return this.state};f.A=function(a,b){return this===b};
var Qe=function(){function a(a){return new Oe(a,null,null,null)}var b=null,c=function(){function a(c,d){var k=null;1<arguments.length&&(k=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,c,k)}function b(a,c){var d=mc(c)?U.c(te,c):c,e=S.c(d,Pe),d=S.c(d,na);return new Oe(a,d,e,null)}a.n=1;a.m=function(a){var c=H(a);a=I(a);return b(c,a)};a.j=b;return a}(),b=function(b,e){switch(arguments.length){case 1:return a.call(this,b);default:return c.j(b,N(arguments,1))}throw Error("Invalid arity: "+
arguments.length);};b.n=1;b.m=c.m;b.f=a;b.j=c.j;return b}();function Re(a,b){if(a instanceof Oe){var c=a.zc;if(null!=c&&!r(c.f?c.f(b):c.call(null,b)))throw Error([w("Assert failed: "),w("Validator rejected reference state"),w("\n"),w(Ke.j(N([zc(new Gb(null,"validate","validate",1233162959,null),new Gb(null,"new-value","new-value",972165309,null))],0)))].join(""));c=a.state;a.state=b;null!=a.Ga&&pb(a,c,b);return b}return Me(a,b)}
var Se=function(){function a(a,b,c,d){return a instanceof Oe?Re(a,b.e?b.e(a.state,c,d):b.call(null,a.state,c,d)):Ne.t(a,b,c,d)}function b(a,b,c){return a instanceof Oe?Re(a,b.c?b.c(a.state,c):b.call(null,a.state,c)):Ne.e(a,b,c)}function c(a,b){return a instanceof Oe?Re(a,b.f?b.f(a.state):b.call(null,a.state)):Ne.c(a,b)}var d=null,e=function(){function a(c,d,e,g,s){var B=null;4<arguments.length&&(B=N(Array.prototype.slice.call(arguments,4),0));return b.call(this,c,d,e,g,B)}function b(a,c,d,e,g){return a instanceof
Oe?Re(a,U.N(c,a.state,d,e,g)):Ne.N(a,c,d,e,g)}a.n=4;a.m=function(a){var c=H(a);a=L(a);var d=H(a);a=L(a);var e=H(a);a=L(a);var g=H(a);a=I(a);return b(c,d,e,g,a)};a.j=b;return a}(),d=function(d,h,k,l,p){switch(arguments.length){case 2:return c.call(this,d,h);case 3:return b.call(this,d,h,k);case 4:return a.call(this,d,h,k,l);default:return e.j(d,h,k,l,N(arguments,4))}throw Error("Invalid arity: "+arguments.length);};d.n=4;d.m=e.m;d.c=c;d.e=b;d.t=a;d.j=e.j;return d}(),Te=null,Ue=function(){function a(a){null==
Te&&(Te=Qe.f(0));return Ib.f([w(a),w(Se.c(Te,Lb))].join(""))}function b(){return c.f("G__")}var c=null,c=function(c){switch(arguments.length){case 0:return b.call(this);case 1:return a.call(this,c)}throw Error("Invalid arity: "+arguments.length);};c.P=b;c.f=a;return c}(),Ve={};function We(a){if(a?a.Ub:a)return a.Ub(a);var b;b=We[m(null==a?null:a)];if(!b&&(b=We._,!b))throw v("IEncodeJS.-clj-\x3ejs",a);return b.call(null,a)}
function Xe(a){return(a?r(r(null)?null:a.Tb)||(a.Y?0:t(Ve,a)):t(Ve,a))?We(a):"string"===typeof a||"number"===typeof a||a instanceof V||a instanceof Gb?Ye.f?Ye.f(a):Ye.call(null,a):Ke.j(N([a],0))}
var Ye=function Ze(b){if(null==b)return null;if(b?r(r(null)?null:b.Tb)||(b.Y?0:t(Ve,b)):t(Ve,b))return We(b);if(b instanceof V)return Bc(b);if(b instanceof Gb)return""+w(b);if(gc(b)){var c={};b=F(b);for(var d=null,e=0,g=0;;)if(g<e){var h=d.R(null,g),k=R.e(h,0,null),h=R.e(h,1,null);c[Xe(k)]=Ze(h);g+=1}else if(b=F(b))ic(b)?(e=yb(b),b=zb(b),d=e,e=Q(e)):(e=H(b),d=R.e(e,0,null),e=R.e(e,1,null),c[Xe(d)]=Ze(e),b=L(b),d=null,e=0),g=0;else break;return c}if(null==b?0:b?b.l&8||b.Ec||(b.l?0:t(Ea,b)):t(Ea,b)){c=
[];b=F(Xc.c(Ze,b));d=null;for(g=e=0;;)if(g<e)k=d.R(null,g),c.push(k),g+=1;else if(b=F(b))d=b,ic(d)?(b=yb(d),g=zb(d),d=b,e=Q(b),b=g):(b=H(d),c.push(b),b=L(d),d=null,e=0),g=0;else break;return c}return u?b:null};function $e(a,b){this.message=a;this.data=b}$e.prototype=Error();$e.prototype.constructor=$e;
var af=function(){function a(a,b){return new $e(a,b)}function b(a,b){return new $e(a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}();var bf=new V(null,"old-state","old-state"),cf=new V(null,"path","path"),df=new V(null,"new-value","new-value"),ef=new V(null,"ctor","ctor"),ff=new V(null,"componentDidUpdate","componentDidUpdate"),gf=new V(null,"fn","fn"),hf=new V(null,"new-state","new-state"),jf=new V(null,"instrument","instrument"),na=new V(null,"meta","meta"),kf=new V(null,"react-key","react-key"),lf=new V(null,"ul","ul"),mf=new V("om.core","id","om.core/id"),oa=new V(null,"dup","dup"),nf=new V(null,"key","key"),u=new V(null,"else",
"else"),Pe=new V(null,"validator","validator"),of=new V(null,"content","content"),Fb=new V(null,"default","default"),pf=new V(null,"events","events"),qf=new V(null,"navigation","navigation"),rf=new V(null,"old-value","old-value"),sf=new V("om.core","pass","om.core/pass"),tf=new V(null,"init-state","init-state"),uf=new V(null,"wrappee","wrappee"),vf=new V(null,"state","state"),ka=new V(null,"flush-on-newline","flush-on-newline"),wf=new V(null,"componentWillUnmount","componentWillUnmount"),xf=new V(null,
"componentWillReceiveProps","componentWillReceiveProps"),yf=new V(null,"header","header"),zf=new V(null,"className","className"),Af=new V(null,"sym","sym"),Bf=new V(null,"shouldComponentUpdate","shouldComponentUpdate"),Cf=new V(null,"style","style"),Df=new V(null,"textarea","textarea"),Ef=new V(null,"div","div"),ma=new V(null,"readably","readably"),Ff=new V(null,"for","for"),Gf=new V(null,"render","render"),pa=new V(null,"print-length","print-length"),Hf=new V(null,"componentWillUpdate","componentWillUpdate"),
If=new V(null,"id","id"),Jf=new V(null,"class","class"),Kf=new V(null,"getInitialState","getInitialState"),Lf=new V(null,"opts","opts"),Mf=new V("om.core","index","om.core/index"),Nf=new V(null,"attrs","attrs"),Of=new V(null,"shared","shared"),Pf=new V(null,"componentDidMount","componentDidMount"),Qf=new V(null,"htmlFor","htmlFor"),Rf=new V(null,"tag","tag"),Sf=new V(null,"input","input"),Tf=new V(null,"target","target"),Uf=new V(null,"getDisplayName","getDisplayName"),Vf=new V(null,"h1","h1"),Wf=
new V(null,"componentWillMount","componentWillMount"),Xf=new V(null,"onClick","onClick"),Yf=new V(null,"href","href"),Zf=new V("om.core","defer","om.core/defer"),$f=new V(null,"a","a"),ag=new V(null,"heading","heading"),bg=new V(null,"tx-listen","tx-listen");var cg=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return React.DOM.a.apply(null,xa.f(O(a,b)))}a.n=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}(),dg=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return React.DOM.div.apply(null,xa.f(O(a,b)))}a.n=1;a.m=function(a){var d=H(a);a=
I(a);return b(d,a)};a.j=b;return a}(),eg=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return React.DOM.h1.apply(null,xa.f(O(a,b)))}a.n=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}(),fg=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return React.DOM.header.apply(null,xa.f(O(a,b)))}
a.n=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}(),gg=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return React.DOM.li.apply(null,xa.f(O(a,b)))}a.n=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}(),hg=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return React.DOM.span.apply(null,
xa.f(O(a,b)))}a.n=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}(),ig=function(){function a(a,d){var e=null;1<arguments.length&&(e=N(Array.prototype.slice.call(arguments,1),0));return b.call(this,a,e)}function b(a,b){return React.DOM.ul.apply(null,xa.f(O(a,b)))}a.n=1;a.m=function(a){var d=H(a);a=I(a);return b(d,a)};a.j=b;return a}();
function jg(a,b){React.createClass({render:function(){return this.transferPropsTo(a.f?a.f({children:this.props.children,onChange:this.onChange,value:this.state.value}):a.call(null,{children:this.props.children,onChange:this.onChange,value:this.state.value}))},componentWillReceiveProps:function(a){return this.setState({value:a.value})},onChange:function(a){var b=this.props.onChange;if(null==b)return null;b.f?b.f(a):b.call(null,a);return this.setState({value:a.target.value})},getInitialState:function(){return{value:this.props.value}},
getDisplayName:function(){return b}})}jg(React.DOM.input,"input");jg(React.DOM.textarea,"textarea");jg(React.DOM.option,"option");var kg,lg,mg,ng;function og(){return aa.navigator?aa.navigator.userAgent:null}ng=mg=lg=kg=!1;var pg;if(pg=og()){var qg=aa.navigator;kg=0==pg.lastIndexOf("Opera",0);lg=!kg&&(-1!=pg.indexOf("MSIE")||-1!=pg.indexOf("Trident"));mg=!kg&&-1!=pg.indexOf("WebKit");ng=!kg&&!mg&&!lg&&"Gecko"==qg.product}var rg=lg,sg=ng,tg=mg;function ug(){var a=aa.document;return a?a.documentMode:void 0}var vg;
a:{var wg="",xg;if(kg&&aa.opera)var yg=aa.opera.version,wg="function"==typeof yg?yg():yg;else if(sg?xg=/rv\:([^\);]+)(\)|;)/:rg?xg=/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/:tg&&(xg=/WebKit\/(\S+)/),xg)var zg=xg.exec(og()),wg=zg?zg[1]:"";if(rg){var Ag=ug();if(Ag>parseFloat(wg)){vg=String(Ag);break a}}vg=wg}var Bg={};
function Cg(a){if(!Bg[a]){for(var b=0,c=String(vg).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),d=String(a).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),e=Math.max(c.length,d.length),g=0;0==b&&g<e;g++){var h=c[g]||"",k=d[g]||"",l=RegExp("(\\d*)(\\D*)","g"),p=RegExp("(\\d*)(\\D*)","g");do{var q=l.exec(h)||["","",""],s=p.exec(k)||["","",""];if(0==q[0].length&&0==s[0].length)break;b=((0==q[1].length?0:parseInt(q[1],10))<(0==s[1].length?0:parseInt(s[1],10))?-1:(0==q[1].length?0:parseInt(q[1],10))>
(0==s[1].length?0:parseInt(s[1],10))?1:0)||((0==q[2].length)<(0==s[2].length)?-1:(0==q[2].length)>(0==s[2].length)?1:0)||(q[2]<s[2]?-1:q[2]>s[2]?1:0)}while(0==b)}Bg[a]=0<=b}}var Dg=aa.document,Eg=Dg&&rg?ug()||("CSS1Compat"==Dg.compatMode?parseInt(vg,10):5):void 0;if(sg||rg){var Fg;if(Fg=rg)Fg=rg&&9<=Eg;Fg||sg&&Cg("1.9.1")}rg&&Cg("9");function Gg(a,b){return wa.e(function(a,b){var e=R.e(b,0,null),g=R.e(b,1,null);return Sc.c(e,g)&&oc(a,e)?Yb.c(T.e(a,g,S.c(a,e)),e):a},a,b)};var Hg=function(){function a(a,b){return U.c(w,cd(a,b))}function b(a){return U.c(w,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}();function Ig(a){return a.toUpperCase()}function Jg(a){return a.toLowerCase()}function Kg(a){return 2>Q(a)?Ig(a):[w(Ig(tc.e(a,0,1))),w(Jg(tc.c(a,1)))].join("")}
function Lg(a,b){if(0>=b||b>=2+Q(a))return Vb.c(Kd(O("",Xc.c(w,F(a)))),"");if(r(D.c?D.c(1,b):D.call(null,1,b)))return new X(null,1,5,Y,[a],null);if(r(D.c?D.c(2,b):D.call(null,2,b)))return new X(null,2,5,Y,["",a],null);var c=b-2;return Vb.c(Kd(O("",Md.e(Kd(Xc.c(w,F(a))),0,c))),tc.c(a,c))}
var Mg=function(){function a(a,b,c){if(D.c(""+w(b),"/(?:)/"))b=Lg(a,c);else if(1>c)b=Kd((""+w(a)).split(b));else a:{for(var h=c,k=Fd;;){if(D.c(h,1)){b=Vb.c(k,a);break a}var l;l=b.exec(a);l=null==l?null:1===Q(l)?H(l):Kd(l);if(r(l)){var p=l;l=a.indexOf(p);p=a.substring(l+Q(p));h-=1;k=Vb.c(k,a.substring(0,l));a=p}else{b=Vb.c(k,a);break a}}b=void 0}if(D.c(0,c))a:{for(c=b;;)if(D.c("",null==c?null:Ua(c)))c=null==c?null:Va(c);else break a;c=void 0}else c=b;return c}function b(a,b){return c.e(a,b,0)}var c=
null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}();var Ng=/([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?/;function Og(a){if(r(a)){var b=Mg.c(Bc(a),/-/),c=R.e(b,0,null),b=sc(b);return ec(b)||D.c("aria",c)||D.c("data",c)?a:Cc.f(Hg.f(Vb.c(Xc.c(Kg,b),c)))}return null}function Pg(a){return wa.e(function(a,c){var d=S.c(a,c);return r(d)?a:Yb.c(a,c)},a,ve(a))}
var Qg=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){var b=Kd(hd(qa,ed.c(function(a){return(a?a.l&33554432||a.Ic||(a.l?0:t(kb,a)):t(kb,a))?new X(null,1,5,Y,[a],null):hc(a)?a:u?new X(null,1,5,Y,[a],null):null},Xc.c(Jf,a))));a=U.c(we,a);return ec(b)?a:T.e(a,Jf,b)}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}();function Rg(a){if(a?a.za:a)return a.za(a);var b;b=Rg[m(null==a?null:a)];if(!b&&(b=Rg._,!b))throw v("IInterpreter.interpret",a);return b.call(null,a)}
function Sg(a){return React.createClass({render:function(){return this.transferPropsTo(a.f?a.f({children:this.props.children,onChange:this.onChange,value:this.state.value}):a.call(null,{children:this.props.children,onChange:this.onChange,value:this.state.value}))},componentWillReceiveProps:function(a){return this.setState({value:a.value})},onChange:function(a){var c=this.props.onChange;if(null==c)return null;c.f?c.f(a):c.call(null,a);return this.setState({value:a.target.value})},getInitialState:function(){return{value:this.props.value}}})}
var Tg=Sg(React.DOM.input),Ug=Sg(React.DOM.textarea);function Vg(a){var b=Ye,c=we.j(N([Ae(ve(a),Xc.c(Og,ve(a))),new n(null,2,[Jf,zf,Ff,Qf],null)],0));a=Gg(a,c);b=b(a);a=Hg.c(" ",jd(F(b.className)));ra(/^[\s\xa0]*$/.test(null==a?"":String(a)))&&(b.className=a);return b}function Wg(a){return xa.f(Xc.c(Rg,a))}Rg["null"]=function(){return null};Rg._=function(a){return a};
X.prototype.za=function(){var a,b=R.e(this,0,null),c=sc(this);if(!(b instanceof V||b instanceof Gb||"string"===typeof b))throw af.c([w(b),w(" is not a valid element name.")].join(""),new n(null,2,[Rf,b,of,c],null));var d,b=Bc(b);a=Ng.exec(b);d=D.c(H(a),b)?1===Q(a)?H(a):Kd(a):null;R.e(d,0,null);b=R.e(d,1,null);a=R.e(d,2,null);d=R.e(d,3,null);a=Pg(new n(null,2,[If,a,Jf,r(d)?Mg.c(d,/\./):null],null));d=H(c);a=gc(d)?new X(null,3,5,Y,[b,Qg.j(N([a,d],0)),L(c)],null):new X(null,3,5,Y,[b,a,c],null);b=R.e(a,
0,null);c=R.e(a,1,null);a=R.e(a,2,null);d=React.DOM[Bc(b)];if(r(d))b=S.e(new n(null,2,[Sf,Tg,Df,Ug],null),Cc.f(b),d);else throw af.c([w("Unsupported HTML tag: "),w(Bc(b))].join(""),new n(null,1,[Rf,b],null));return b.call(null,Vg(c),fc(a)&&"string"===typeof H(a)&&ec(I(a))?Rg(H(a)):r(a)?Rg(a):null)};Kb.prototype.za=function(){return Wg(this)};xc.prototype.za=function(){return Wg(this)};W.prototype.za=function(){return Wg(this)};Ld.prototype.za=function(){return Wg(this)};Ac.prototype.za=function(){return Wg(this)};function Xg(a){w(a);w("_NODE")}Xg("ATTRIBUTE");Xg("COMMENT");Xg("DOCUMENT");Xg("DOCUMENT_TYPE");Xg("ELEMENT");Xg("TEXT");function Yg(a){a.prototype.ac=!0;a.prototype.K=function(){return N.f(this)}}Yg(NodeList);"undefined"!==typeof NamedNodeMap&&Yg(NamedNodeMap);"undefined"!==typeof MozNamedAttrMap&&Yg(MozNamedAttrMap);var Zg=React.createClass({componentDidMount:function(a){var b;b=this.props.onMount;b=r(b)?b:this.props.onRender;return r(b)?b.f?b.f(a):b.call(null,a):null},componentDidUpdate:function(a,b,c){a=this.props.onUpdate;a=r(a)?a:this.props.onRender;return r(a)?a.f?a.f(c):a.call(null,c):null},render:function(){return this.props.wrappee}}),$g=new xe(null,new n(null,2,["aria",null,"data",null],null),null);function ah(a){return wa.e(function(a,c){return mc(c)?Oc.c(c,a):Vb.c(a,c)},K,(a?a.l&134217728||a.Kc||(a.l?0:t(lb,a)):t(lb,a))?mb(a):wa.e(Vb,K,a))}
function bh(){var a=ch;return function(){function b(a,b){var g=null;1<arguments.length&&(g=N(Array.prototype.slice.call(arguments,1),0));return c.call(this,a,g)}function c(c,e){var g;mc(c)?g=U.c(b,c):gc(c)&&!ec(pf.f(c))?(g=pf.f(c),g=Zg.f?Zg.f(Ye(T.e(g,uf,a.f?a.f(c):a.call(null,c)))):Zg.call(null,Ye(T.e(g,uf,a.f?a.f(c):a.call(null,c))))):g=u?a.f?a.f(c):a.call(null,c):null;if(!ec(e)){var h;h=U.c(b,e);h=mc(h)?h:Fa(K,h);g=O(g,h)}return g}b.n=1;b.m=function(a){var b=H(a);a=I(a);return c(b,a)};b.j=c;return b}()}
var dh=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return function(b){return T.e(b,of,a)}}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}(),eh=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return function(){return a}}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}(),fh=function(){function a(a){var d=
null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){return function(b){return wa.e(function(a,b){return b.f?b.f(a):b.call(null,a)},b,a)}}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}(),gh=new xe(null,new n(null,3,["onRender",null,"onUpdate",null,"onMount",null],null),null),hh=function(){function a(a){var d=null;0<arguments.length&&(d=N(Array.prototype.slice.call(arguments,0),0));return b.call(this,d)}function b(a){a=Xc.c(function(a){var b=
R.e(a,0,null);a=R.e(a,1,null);var c=Y;if("string"!==typeof b)var b=Bc(b),d=Mg.c(b,/-/),e=R.e(d,0,null),d=sc(d),b=r($g.f?$g.f(e):$g.call(null,e))?b:U.e(w,e,Xc.c(Kg,d));return new X(null,2,5,c,[b,a],null)},ld.c(2,a));var b=wa.e(function(){return function(a,b){var c=R.e(a,0,null),d=R.e(a,1,null),e=R.e(b,0,null),g=R.e(b,1,null);return r(gh.f?gh.f(e):gh.call(null,e))?new X(null,2,5,Y,[T.e(c,e,g),d],null):new X(null,2,5,Y,[c,T.e(d,e,g)],null)}}(a),Fd,a),e=R.e(b,0,null),g=R.e(b,1,null);return function(a,
b,c,d){return function(a){return T.j(a,Nf,we.j(N([Nf.f(a),d],0)),N([pf,we.j(N([pf.f(a),c],0))],0))}}(a,b,e,g)}a.n=0;a.m=function(a){a=F(a);return b(a)};a.j=b;return a}();var ch=function(){function a(a,d){1<arguments.length&&N(Array.prototype.slice.call(arguments,1),0);return b.call(this,a)}function b(a){return gc(a)?U.e(Af.f(a),Ye(Nf.f(a)),ah(of.f(a))):a}a.n=1;a.m=function(a){var d=H(a);I(a);return b(d)};a.j=b;return a}();function ih(){}ih.fc=function(){return ih.Hb?ih.Hb:ih.Hb=new ih};ih.prototype.jc=0;var Z=!1,jh=null,kh=null,lh={};function mh(a){if(a?a.mc:a)return a.mc(a);var b;b=mh[m(null==a?null:a)];if(!b&&(b=mh._,!b))throw v("IDisplayName.display-name",a);return b.call(null,a)}var nh={};function oh(a){if(a?a.nc:a)return a.nc(a);var b;b=oh[m(null==a?null:a)];if(!b&&(b=oh._,!b))throw v("IInitState.init-state",a);return b.call(null,a)}var ph={};
function qh(a,b,c){if(a?a.rc:a)return a.rc(a,b,c);var d;d=qh[m(null==a?null:a)];if(!d&&(d=qh._,!d))throw v("IShouldUpdate.should-update",a);return d.call(null,a,b,c)}var rh={};function sh(a){if(a?a.uc:a)return a.uc(a);var b;b=sh[m(null==a?null:a)];if(!b&&(b=sh._,!b))throw v("IWillMount.will-mount",a);return b.call(null,a)}var th={};function uh(a){if(a?a.kc:a)return a.kc(a);var b;b=uh[m(null==a?null:a)];if(!b&&(b=uh._,!b))throw v("IDidMount.did-mount",a);return b.call(null,a)}var vh={};
function wh(a){if(a?a.wc:a)return a.wc(a);var b;b=wh[m(null==a?null:a)];if(!b&&(b=wh._,!b))throw v("IWillUnmount.will-unmount",a);return b.call(null,a)}var xh={};function yh(a,b,c){if(a?a.xc:a)return a.xc(a,b,c);var d;d=yh[m(null==a?null:a)];if(!d&&(d=yh._,!d))throw v("IWillUpdate.will-update",a);return d.call(null,a,b,c)}var zh={};function Ah(a,b,c){if(a?a.lc:a)return a.lc(a,b,c);var d;d=Ah[m(null==a?null:a)];if(!d&&(d=Ah._,!d))throw v("IDidUpdate.did-update",a);return d.call(null,a,b,c)}
var Bh={};function Ch(a,b){if(a?a.vc:a)return a.vc(a,b);var c;c=Ch[m(null==a?null:a)];if(!c&&(c=Ch._,!c))throw v("IWillReceiveProps.will-receive-props",a);return c.call(null,a,b)}var Dh={};function Eh(a){if(a?a.Nb:a)return a.Nb();var b;b=Eh[m(null==a?null:a)];if(!b&&(b=Eh._,!b))throw v("IRender.render",a);return b.call(null,a)}var Fh={};function Gh(a,b){if(a?a.qc:a)return a.qc(a,b);var c;c=Gh[m(null==a?null:a)];if(!c&&(c=Gh._,!c))throw v("IRenderState.render-state",a);return c.call(null,a,b)}
var Hh={};function Ih(a,b,c,d,e){if(a?a.oc:a)return a.oc(a,b,c,d,e);var g;g=Ih[m(null==a?null:a)];if(!g&&(g=Ih._,!g))throw v("IOmSwap.-om-swap!",a);return g.call(null,a,b,c,d,e)}
var Jh=function(){function a(a,b){if(a?a.Lb:a)return a.Lb(a,b);var c;c=Jh[m(null==a?null:a)];if(!c&&(c=Jh._,!c))throw v("IGetState.-get-state",a);return c.call(null,a,b)}function b(a){if(a?a.Kb:a)return a.Kb(a);var b;b=Jh[m(null==a?null:a)];if(!b&&(b=Jh._,!b))throw v("IGetState.-get-state",a);return b.call(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}(),
Kh=function(){function a(a,b){if(a?a.Jb:a)return a.Jb(a,b);var c;c=Kh[m(null==a?null:a)];if(!c&&(c=Kh._,!c))throw v("IGetRenderState.-get-render-state",a);return c.call(null,a,b)}function b(a){if(a?a.Ib:a)return a.Ib(a);var b;b=Kh[m(null==a?null:a)];if(!b&&(b=Kh._,!b))throw v("IGetRenderState.-get-render-state",a);return b.call(null,a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=
b;c.c=a;return c}();function Lh(a){if(a?a.Qb:a)return a.value;var b;b=Lh[m(null==a?null:a)];if(!b&&(b=Lh._,!b))throw v("IValue.-value",a);return b.call(null,a)}Lh._=function(a){return a};var Mh={};function Nh(a){if(a?a.Xa:a)return a.Xa(a);var b;b=Nh[m(null==a?null:a)];if(!b&&(b=Nh._,!b))throw v("ICursor.-path",a);return b.call(null,a)}function Oh(a){if(a?a.Ya:a)return a.Ya(a);var b;b=Oh[m(null==a?null:a)];if(!b&&(b=Oh._,!b))throw v("ICursor.-state",a);return b.call(null,a)}
var Ph={},Qh=function(){function a(a,b,c){if(a?a.tc:a)return a.tc(a,b,c);var h;h=Qh[m(null==a?null:a)];if(!h&&(h=Qh._,!h))throw v("IToCursor.-to-cursor",a);return h.call(null,a,b,c)}function b(a,b){if(a?a.sc:a)return a.sc(a,b);var c;c=Qh[m(null==a?null:a)];if(!c&&(c=Qh._,!c))throw v("IToCursor.-to-cursor",a);return c.call(null,a,b)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};
c.c=b;c.e=a;return c}();function Rh(a){return Nh(a)}function Sh(a,b,c){if(a?a.Mb:a)return a.Mb(a,b,c);var d;d=Sh[m(null==a?null:a)];if(!d&&(d=Sh._,!d))throw v("INotify.-notify",a);return d.call(null,a,b,c)}
function Th(a,b,c,d,e){var g=Ya(a),h=kd(Rh.f?Rh.f(b):Rh.call(null,b),c);c=(a?r(r(null)?null:a.Wc)||(a.Y?0:t(Hh,a)):t(Hh,a))?Ih(a,b,c,d,e):ec(h)?Se.c(a,d):u?Se.t(a,pd,h,d):null;if(D.c(c,Zf))return null;a=new n(null,5,[cf,h,rf,md.c(g,h),df,md.c(Ya(a),h),bf,g,hf,Ya(a)],null);return null!=e?Uh.c?Uh.c(b,T.e(a,Rf,e)):Uh.call(null,b,T.e(a,Rf,e)):Uh.c?Uh.c(b,a):Uh.call(null,b,a)}
function Vh(a){var b=a.props.children;if(Zb(b)){var c=a.props,d;a:{var e=Z;try{Z=!0;d=b.f?b.f(a):b.call(null,a);break a}finally{Z=e}d=void 0}a=c.children=d}else a=b;return a}function Wh(a){return a.props.__om_cursor}
var Xh=function(){function a(a,b){var c=fc(b)?b:new X(null,1,5,Y,[b],null);return Jh.c(a,c)}function b(a){return Jh.f(a)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}(),Yh=function(){function a(a,b){return fc(b)?ec(b)?c.f(a):u?md.c(c.f(a),b):null:S.c(c.f(a),b)}function b(a){return null==a?null:a.props.__om_shared}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,
c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}();function Zh(a){a=a.state;var b=a.__om_pending_state;return r(b)?(a.__om_prev_state=a.__om_state,a.__om_state=b,a.__om_pending_state=null,a):null}
var $h=function(){function a(a,b){var c=r(b)?b:a.props,h=c.__om_state;if(r(h)){var k=a.state,l=k.__om_pending_state;k.__om_pending_state=we.j(N([r(l)?l:k.__om_state,h],0));return c.__om_state=null}return null}function b(a){return c.c(a,null)}var c=null,c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+arguments.length);};c.f=b;c.c=a;return c}(),ai=Xb([ff,wf,xf,Bf,Gf,Hf,Kf,Pf,Uf,Wf],[function(a){var b=Vh(this);if(b?r(r(null)?
null:b.Qc)||(b.Y?0:t(zh,b)):t(zh,b)){var c=this.state,d=Z;try{Z=!0;var e=c.__om_prev_state;Ah(b,Wh({props:a}),r(e)?e:c.__om_state)}finally{Z=d}}return this.state.__om_prev_state=null},function(){var a=Vh(this);if(a?r(r(null)?null:a.fd)||(a.Y?0:t(vh,a)):t(vh,a)){var b=Z;try{return Z=!0,wh(a)}finally{Z=b}}else return null},function(a){var b=Vh(this);if(b?r(r(null)?null:b.ed)||(b.Y?0:t(Bh,b)):t(Bh,b)){var c=Z;try{return Z=!0,Ch(b,Wh({props:a}))}finally{Z=c}}else return null},function(a){var b=Z;try{Z=
!0;var c=this.props,d=this.state,e=Vh(this);$h.c(this,a);return(e?r(r(null)?null:e.ad)||(e.Y?0:t(ph,e)):t(ph,e))?qh(e,Wh({props:a}),Jh.f(this)):Lh(c.__om_cursor)!==Lh(a.__om_cursor)?!0:null!=d.__om_pending_state?!0:c.__om_index!==a.__om_index?!0:u?!1:null}finally{Z=b}},function(){var a=Vh(this),b=this.props,c=Z;try{if(Z=!0,a?r(r(null)?null:a.pc)||(a.Y?0:t(Dh,a)):t(Dh,a)){var d=jh,e=kh;try{return jh=this,kh=b.__om_instrument,Eh(a)}finally{kh=e,jh=d}}else if(a?r(r(null)?null:a.Xc)||(a.Y?0:t(Fh,a)):
t(Fh,a)){d=jh;e=kh;try{return jh=this,kh=b.__om_instrument,Gh(a,Xh.f(this))}finally{kh=e,jh=d}}else return u?a:null}finally{Z=c}},function(a){var b=Vh(this);if(b?r(r(null)?null:b.gd)||(b.Y?0:t(xh,b)):t(xh,b)){var c=Z;try{Z=!0,yh(b,Wh({props:a}),Jh.f(this))}finally{Z=c}}return Zh(this)},function(){var a=Vh(this),b=this.props,c=function(){var a=b.__om_init_state;return r(a)?a:Xd}(),d=mf.f(c),c={__om_state:we.j(N([Yb.c(c,mf),(a?r(r(null)?null:a.Uc)||(a.Y?0:t(nh,a)):t(nh,a))?function(){var b=Z;try{return Z=
!0,oh(a)}finally{Z=b}}():null],0)),__om_id:r(d)?d:":"+(ih.fc().jc++).toString(36)};b.__om_init_state=null;return c},function(){var a=Vh(this);if(a?r(r(null)?null:a.Pc)||(a.Y?0:t(th,a)):t(th,a)){var b=Z;try{return Z=!0,uh(a)}finally{Z=b}}else return null},function(){var a=Vh(this);if(a?r(r(null)?null:a.Rc)||(a.Y?0:t(lh,a)):t(lh,a)){var b=Z;try{return Z=!0,mh(a)}finally{Z=b}}else return null},function(){$h.f(this);var a=Vh(this);if(a?r(r(null)?null:a.cd)||(a.Y?0:t(rh,a)):t(rh,a)){var b=Z;try{Z=!0,sh(a)}finally{Z=
b}}return Zh(this)}]),bi=React.createClass(function(a){a.Tc=!0;a.Kb=function(){return function(){var a=this.state,c=a.__om_pending_state;return r(c)?c:a.__om_state}}(a);a.Lb=function(){return function(a,c){return md.c(Jh.f(this),c)}}(a);a.Sc=!0;a.Ib=function(){return function(){return this.state.__om_state}}(a);a.Jb=function(){return function(a,c){return md.c(Kh.f(this),c)}}(a);a.Yc=!0;a.Zc=function(){return function(a,c){var d=Z;try{Z=!0;var e=this.props.__om_cursor,g=Nh(e);this.state.__om_pending_state=
c;return ec(g)?Se.c(Oh(e),Jb):Se.t(Oh(e),pd,g,Jb)}finally{Z=d}}}(a);a.$c=function(){return function(a,c,d){a=Z;try{Z=!0;var e=this.state,g=this.props.__om_cursor,h=Nh(g),k=Jh.f(this);e.__om_pending_state=od(k,c,d);return ec(h)?Se.c(Oh(g),Jb):Se.t(Oh(g),pd,h,Jb)}finally{Z=a}}}(a);return a}(Ye(ai)));function ci(a){return new bi(a)}function di(a){return a?r(r(null)?null:a.ub)?!0:a.Y?!1:t(Mh,a):t(Mh,a)}function ei(a,b,c){this.value=a;this.state=b;this.path=c;this.l=2158397195;this.v=8192}f=ei.prototype;
f.D=function(a,b){return A.e(this,b,null)};f.F=function(a,b,c){if(Z)return a=A.e(this.value,b,c),D.c(a,c)?c:$.e?$.e(a,this.state,Vb.c(this.path,b)):$.call(null,a,this.state,Vb.c(this.path,b));throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.C=function(a,b,c){if(Z)return ob(this.value,b,c);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.ub=!0;f.Xa=function(){return this.path};f.Ya=function(){return this.state};
f.J=function(){if(Z)return ac(this.value);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.aa=function(){return new ei(this.value,this.state,this.path)};f.O=function(){if(Z)return Ca(this.value);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.A=function(a,b){if(Z)return di(b)?D.c(this.value,Lh(b)):D.c(this.value,b);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.Qb=function(){return this.value};
f.Va=function(a,b){if(Z)return new ei(Oa(this.value,b),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.Ob=!0;f.Pb=function(a,b,c,d){return Th(this.state,this,b,c,d)};
f.Ja=function(a,b){if(Z)return La(this.value,b);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.ya=function(a,b,c){if(Z)return new ei(Ma(this.value,b,c),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.K=function(){var a=this;if(Z)return 0<Q(a.value)?Xc.c(function(){return function(b){var c=R.e(b,0,null);b=R.e(b,1,null);return new X(null,2,5,Y,[c,$.e?$.e(b,a.state,Vb.c(a.path,c)):$.call(null,b,a.state,Vb.c(a.path,c))],null)}}(this),a.value):null;throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.L=function(a,b){if(Z)return new ei(Ub(this.value,b),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.M=function(a,b){if(Z)return new ei(Fa(this.value,b),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.D(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.D(null,a)};f.c=function(a,b){return this.F(null,a,b)};f.Ka=function(){if(Z)throw Error([w("Cannot deref cursor during render phase: "),w(this)].join(""));return md.c(Ya(this.state),this.path)};
function fi(a,b,c){this.value=a;this.state=b;this.path=c;this.l=2175181595;this.v=8192}f=fi.prototype;f.D=function(a,b){if(Z)return x.e(this,b,null);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.F=function(a,b,c){if(Z)return x.e(this,b,c);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.R=function(a,b){if(Z)return $.e?$.e(x.c(this.value,b),this.state,Vb.c(this.path,b)):$.call(null,x.c(this.value,b),this.state,Vb.c(this.path,b));throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.ea=function(a,b,c){if(Z)return b<Ca(this.value)?$.e?$.e(x.c(this.value,b),this.state,Vb.c(this.path,b)):$.call(null,x.c(this.value,b),this.state,Vb.c(this.path,b)):c;throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.C=function(a,b,c){if(Z)return ob(this.value,b,c);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.ub=!0;f.Xa=function(){return this.path};f.Ya=function(){return this.state};
f.J=function(){if(Z)return ac(this.value);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.aa=function(){return new fi(this.value,this.state,this.path)};f.O=function(){if(Z)return Ca(this.value);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.Ba=function(){if(Z)return $.e?$.e(Ua(this.value),this.state,this.path):$.call(null,Ua(this.value),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.Ca=function(){if(Z)return $.e?$.e(Va(this.value),this.state,this.path):$.call(null,Va(this.value),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.A=function(a,b){if(Z)return di(b)?D.c(this.value,Lh(b)):D.c(this.value,b);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.Qb=function(){return this.value};f.Ob=!0;f.Pb=function(a,b,c,d){return Th(this.state,this,b,c,d)};
f.Ja=function(a,b){if(Z)return La(this.value,b);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.ya=function(a,b,c){if(Z)return $.e?$.e(Xa(this.value,b,c),this.state,this.path):$.call(null,Xa(this.value,b,c),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.K=function(){var a=this;if(Z)return 0<Q(a.value)?Xc.e(function(){return function(b,c){return $.e?$.e(b,a.state,Vb.c(a.path,c)):$.call(null,b,a.state,Vb.c(a.path,c))}}(this),a.value,Ce.P()):null;throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.L=function(a,b){if(Z)return new fi(Ub(this.value,b),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};f.M=function(a,b){if(Z)return new fi(Fa(this.value,b),this.state,this.path);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));};
f.call=function(){var a=null;return a=function(a,c,d){switch(arguments.length){case 2:return this.D(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length);}}();f.apply=function(a,b){return this.call.apply(this,[this].concat(ua(b)))};f.f=function(a){return this.D(null,a)};f.c=function(a,b){return this.F(null,a,b)};f.Ka=function(){if(Z)throw Error([w("Cannot deref cursor during render phase: "),w(this)].join(""));return md.c(Ya(this.state),this.path)};
function gi(a,b,c){var d=Aa(a);d.Vb=!0;d.A=function(){return function(b,c){if(Z)return di(c)?D.c(a,Lh(c)):D.c(a,c);throw Error([w("Cannot manipulate cursor outside of render phase, only "),w("om.core/transact!, om.core/update!, and cljs.core/deref operations allowed")].join(""));}}(d);d.Ob=!0;d.Pb=function(){return function(a,c,d,k){return Th(b,this,c,d,k)}}(d);d.ub=!0;d.Xa=function(){return function(){return c}}(d);d.Ya=function(){return function(){return b}}(d);d.Fc=!0;d.Ka=function(){return function(){if(Z)throw Error([w("Cannot deref cursor during render phase: "),
w(this)].join(""));return md.c(Ya(b),c)}}(d);return d}
var $=function(){function a(a,b,c){return di(a)?a:(a?r(r(null)?null:a.bd)||(a.Y?0:t(Ph,a)):t(Ph,a))?Qh.e(a,b,c):Pb(a)?new fi(a,b,c):gc(a)?new ei(a,b,c):(a?a.v&8192||a.Dc||(a.v?0:t(za,a)):t(za,a))?gi(a,b,c):u?a:null}function b(a,b){return d.e(a,b,Fd)}function c(a){return d.e(a,null,Fd)}var d=null,d=function(d,g,h){switch(arguments.length){case 1:return c.call(this,d);case 2:return b.call(this,d,g);case 3:return a.call(this,d,g,h)}throw Error("Invalid arity: "+arguments.length);};d.f=c;d.c=b;d.e=a;
return d}();function Uh(a,b){var c=Oh(a);return Sh(c,b,$.c(Ya(c),c))}var hi=!1,ii=Qe.f(ze);function ji(){hi=!1;for(var a=F(Ya(ii)),b=null,c=0,d=0;;)if(d<c){var e=b.R(null,d);e.P?e.P():e.call(null);d+=1}else if(a=F(a))b=a,ic(b)?(a=yb(b),c=zb(b),b=a,e=Q(a),a=c,c=e):(e=H(b),e.P?e.P():e.call(null),a=L(b),b=null,c=0),d=0;else return null}
var ki=Qe.f(Xd),li=function(){function a(a,b,c){if(!Tc(new xe(null,new n(null,10,[ef,null,gf,null,jf,null,kf,null,nf,null,tf,null,vf,null,Lf,null,Mf,null,Of,null],null),null),ve(c)))throw Error([w("Assert failed: "),w(U.t(w,"build options contains invalid keys, only :key, :react-key, ",":fn, :init-state, :state, and :opts allowed, given ",cd(", ",ve(c)))),w("\n"),w(Ke.j(N([zc(new Gb(null,"valid?","valid?",1830611324,null),new Gb(null,"m","m",-1640531418,null))],0)))].join(""));if(null==c){var h=function(){var a=
Of.f(c);return r(a)?a:Yh.f(jh)}(),k=function(){var a=ef.f(c);return r(a)?a:ci}(),h=k.f?k.f({children:function(){return function(c){var g=Z;try{return Z=!0,a.c?a.c(b,c):a.call(null,b,c)}finally{Z=g}}}(h,k),__om_instrument:kh,__om_shared:h,__om_cursor:b}):k.call(null,{children:function(){return function(c){var g=Z;try{return Z=!0,a.c?a.c(b,c):a.call(null,b,c)}finally{Z=g}}}(h,k),__om_instrument:kh,__om_shared:h,__om_cursor:b});h.constructor=ba(a);return h}if(u){var l=mc(c)?U.c(te,c):c,p=S.c(l,Lf),q=
S.c(l,tf),s=S.c(l,vf),B=S.c(l,nf),J=S.c(c,gf),G=null!=J?J.f?J.f(b):J.call(null,b):b,M=null!=B?S.c(G,B):S.c(c,kf),h=function(){var a=Of.f(c);return r(a)?a:Yh.f(jh)}(),k=function(){var a=ef.f(c);return r(a)?a:ci}(),h=k.f?k.f({children:null==p?function(b,c,e,g,h,k,l,p){return function(b){var c=Z;try{return Z=!0,a.c?a.c(p,b):a.call(null,p,b)}finally{Z=c}}}(c,l,p,q,s,B,J,G,M,h,k):function(b,c,e,g,h,k,l,p){return function(b){var c=Z;try{return Z=!0,a.e?a.e(p,b,e):a.call(null,p,b,e)}finally{Z=c}}}(c,l,p,
q,s,B,J,G,M,h,k),key:M,__om_instrument:kh,__om_shared:h,__om_state:s,__om_init_state:q,__om_index:Mf.f(c),__om_cursor:G}):k.call(null,{children:null==p?function(b,c,e,g,h,k,l,p){return function(b){var c=Z;try{return Z=!0,a.c?a.c(p,b):a.call(null,p,b)}finally{Z=c}}}(c,l,p,q,s,B,J,G,M,h,k):function(b,c,e,g,h,k,l,p){return function(b){var c=Z;try{return Z=!0,a.e?a.e(p,b,e):a.call(null,p,b,e)}finally{Z=c}}}(c,l,p,q,s,B,J,G,M,h,k),key:M,__om_instrument:kh,__om_shared:h,__om_state:s,__om_init_state:q,__om_index:Mf.f(c),
__om_cursor:G});h.constructor=ba(a);return h}return null}function b(a,b){return c.e(a,b,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}(),mi=function(){function a(a,b,c){if(null!=kh){var h;a:{var k=Z;try{Z=!0;h=kh.e?kh.e(a,b,c):kh.call(null,a,b,c);break a}finally{Z=k}h=void 0}return D.c(h,sf)?li.e(a,b,c):h}return li.e(a,b,c)}function b(a,b){return c.e(a,
b,null)}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length);};c.c=b;c.e=a;return c}();var ni;
function oi(a){var b=R.e(a,0,null),c=R.e(a,1,null);a=ah(new X(null,1,5,Y,[U.e(gg,Ye(new n(null,2,[zf,"nav-item",Cf,null],null)),ah(new X(null,1,5,Y,[bh().call(null,(fh.c?fh.c(dh.f?dh.f(b):dh.call(null,b),hh.c?hh.c(Xf,function(a,b,c){return function(){return c.f?c.f(b):c.call(null,b)}}(a,b,c)):hh.call(null,Xf,function(a,b,c){return function(){return c.f?c.f(b):c.call(null,b)}}(a,b,c))):fh.call(null,dh.f?dh.f(b):dh.call(null,b),hh.c?hh.c(Xf,function(a,b,c){return function(){return c.f?c.f(b):c.call(null,
b)}}(a,b,c)):hh.call(null,Xf,function(a,b,c){return function(){return c.f?c.f(b):c.call(null,b)}}(a,b,c)))).call(null,new n(null,4,[Rf,$f,Nf,new n(null,3,[zf,null,Cf,null,Yf,"#"],null),of,ah(new X(null,1,5,Y,["Placeholder"],null)),Af,cg],null)))],null)))],null));return D.c(1,Q(a))?H(a):U.e(hg,null,a)}
function qi(a){var b=mc(a)?U.c(te,a):a;a=S.c(b,qf);b=S.c(b,ag);a=ah(new X(null,1,5,Y,[U.e(fg,Ye(new n(null,2,[zf,null,Cf,null],null)),ah(new X(null,5,5,Y,["\n      ",bh().call(null,(dh.f?dh.f(b):dh.call(null,b)).call(null,new n(null,4,[Rf,Vf,Nf,new n(null,2,[zf,null,Cf,null],null),of,ah(new X(null,1,5,Y,["Header placeholder"],null)),Af,eg],null))),"\n      ",bh().call(null,(dh.f?dh.f(Xc.c(oi,a)):dh.call(null,Xc.c(oi,a))).call(null,new n(null,4,[Rf,lf,Nf,new n(null,3,[zf,null,Cf,null,If,"navigation"],
null),of,ah(new X(null,3,5,Y,["\n        ",U.e(gg,Ye(new n(null,2,[zf,"nav-item",Cf,null],null)),ah(new X(null,1,5,Y,[U.e(cg,Ye(new n(null,3,[zf,null,Cf,null,Yf,"#"],null)),ah(new X(null,1,5,Y,["Placeholder"],null)))],null))),"\n      "],null)),Af,ig],null))),"\n    "],null)))],null));return D.c(1,Q(a))?H(a):U.e(hg,null,a)}
(function(a,b,c){var d=mc(c)?U.c(te,c):c,e=S.c(d,jf),g=S.c(d,cf),h=S.c(d,bg),k=S.c(d,Of),l=S.c(d,Tf);if(null==l)throw Error([w("Assert failed: "),w("No target specified to om.core/root"),w("\n"),w(Ke.j(N([zc(new Gb(null,"not","not",-1640422260,null),zc(new Gb(null,"nil?","nil?",-1637150201,null),new Gb(null,"target","target",1773529930,null)))],0)))].join(""));var p=Ya(ki);oc(p,l)&&S.c(p,l).call(null);var q=(b?b.v&16384||b.Bc||(b.v?0:t(Le,b)):t(Le,b))?b:Qe.f(b);b=function(){q.Vc=!0;q.Mb=function(a,
b,c,d,e,g,h,k){return function(a,b,c){return null==k?null:k.c?k.c(b,c):k.call(null,b,c)}}(q,q,c,d,d,e,g,h,k,l);return q}();var p=Yb.j(d,Tf,N([bg,cf],0)),s=function(b,c,d,e,g,h,k,l,p,q,s){return function pi(){Se.e(ii,bc,pi);var b=Ya(c),b=null==l?$.e(b,c,Fd):$.e(md.c(b,l),c,l),e;a:{var g=kh;try{kh=k;e=mi.e(a,b,d);break a}finally{kh=g}e=void 0}return React.renderComponent(e,s)}}(q,b,p,c,d,d,e,g,h,k,l),B=Ue.P();qb(b,B,function(a,b,c,d){return function(){oc(Ya(ii),d)||Se.e(ii,Vb,d);if(r(hi))return null;
hi=!0;return"undefined"!==typeof requestAnimationFrame?requestAnimationFrame(ji):setTimeout(ji,16)}}(q,b,p,s,B,c,d,d,e,g,h,k,l));Se.t(ki,T,l,function(a,b,c,d,e,g,h,k,l,p,q,s,B){return function(){rb(b,e);Se.e(ki,Yb,B);return React.unmountComponentAtNode(B)}}(q,b,p,s,B,c,d,d,e,g,h,k,l));return s()})(function ri(b){"undefined"===typeof ni&&(ni=function(b,d,e){this.data=b;this.gc=d;this.ic=e;this.v=0;this.l=393216},ni.tb=!0,ni.sb="kioo-example.core/t8925",ni.Gb=function(b,d){return C(d,"kioo-example.core/t8925")},
ni.prototype.pc=!0,ni.prototype.Nb=function(){var b=this.data,b=ah(new X(null,5,5,Y,["\n    ",bh().call(null,(eh.f?eh.f(qi(b)):eh.call(null,qi(b))).call(null,new n(null,4,[Rf,yf,Nf,new n(null,2,[zf,null,Cf,null],null),of,ah(new X(null,5,5,Y,["\n      ",U.e(eg,Ye(new n(null,2,[zf,null,Cf,null],null)),ah(new X(null,1,5,Y,["Header placeholder"],null))),"\n      ",U.e(ig,Ye(new n(null,3,[zf,null,Cf,null,If,"navigation"],null)),ah(new X(null,3,5,Y,["\n        ",U.e(gg,Ye(new n(null,2,[zf,"nav-item",Cf,
null],null)),ah(new X(null,1,5,Y,[U.e(cg,Ye(new n(null,3,[zf,null,Cf,null,Yf,"#"],null)),ah(new X(null,1,5,Y,["Placeholder"],null)))],null))),"\n      "],null))),"\n    "],null)),Af,fg],null))),"\n    ",bh().call(null,(dh.f?dh.f(of.f(b)):dh.call(null,of.f(b))).call(null,new n(null,4,[Rf,Ef,Nf,new n(null,2,[zf,"content",Cf,null],null),of,ah(new X(null,1,5,Y,["place holder"],null)),Af,dg],null))),"\n  "],null));return D.c(1,Q(b))?H(b):U.e(hg,null,b)},ni.prototype.J=function(){return this.ic},ni.prototype.L=
function(b,d){return new ni(this.data,this.gc,d)});return new ni(b,ri,null)},Qe.f(new n(null,3,[ag,"main",of,"Hello World",qf,new X(null,2,5,Y,[new X(null,2,5,Y,["home",function(a){return alert(a)}],null),new X(null,2,5,Y,["next",function(a){return alert(a)}],null)],null)],null)),new n(null,1,[Tf,document.getElementById("site")],null));
})();
