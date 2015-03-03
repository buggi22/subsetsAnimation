function runAnimation(n, k) {

  if (n < k) {
    alert("n must be greater than k");
    return;
  }

  if (k < 0) {
    alert("k must be non-negative");
    return;
  }

  function factorial(n) {
    if (n <= 0) {
      return 1;
    } else {
      return n * factorial(n-1);
    }
  }

  /**
   * Computes the binomial coefficient n-choose-k.  Used for determining
   * how much vertical space to allocate for the animation.
   */
  function binomial(n, k) {
    return factorial(n) / (factorial(k) * factorial(n-k));
  }

  /**
   * Given an existing subset, find the next available subset.
   * This is the main workhorse of the algorithm that is being animated.
   * Note: subsetObject and the return value are both objects with fields named
   * subset and movedIndex -- subset is an array representing a k-element
   * subset, and movedIndex (possibly null) specifies the index of the element
   * that was most recently shifted rightward.
   * This algorithm does not strictly need to return movedIndex, but it makes
   * the animation code a bit simpler.
   */
  function nextSubset(n, k, subsetObject) {
    if (subsetObject == null) {
      var next = [];
      for (var i = 1; i <= k; i++) {
        next.push(i);
      }
      return {
        "subset": next,
        "movedIndex": null,
      };
    }

    var oldSubsetArray = subsetObject.subset;
    var movedIndex = getIndexToMove(n, k, oldSubsetArray);

    if (movedIndex == null) {
      // We've reached the last subset.
      return null;
    }

    var newSubsetArray = [];
    for (var i = 0; i < oldSubsetArray.length; i++) {
      if (i < movedIndex) {
        newSubsetArray.push(i+1);
      } else if (i == movedIndex) {
        newSubsetArray.push(oldSubsetArray[i] + 1);
      } else {
        newSubsetArray.push(oldSubsetArray[i]);
      }
    }

    return {
      "subset": newSubsetArray,
      "movedIndex": movedIndex,
    };
  }
 
  /**
   * Determines the index of the element that should be shifted right to
   * generate the next subset.  Returns null if no more subsets can
   * be generated.
   */
  function getIndexToMove(n, k, subsetArray) {
    for (var i = 0; i < subsetArray.length - 1; i++) {
      if (subsetArray[i] + 1 < subsetArray[i+1]) {
        return i;
      }
    }
    if (subsetArray[subsetArray.length - 1] < n) {
      return subsetArray.length - 1;
    }
    return null;
  }

  /**
   * Computes the coordinates (within the Raphael SVG element) corresponding
   * to the given row and column indices.
   */
  function getCoords(row, col) {
    var cx = 1.5*radius + col * gridWidth;
    var cy = 1.5*radius + row * gridHeight;
    return [cx, cy];
  }

  /**
   * Computes the path associated with a given arrow.
   * @param params specifies fromRow, fromCol, toRow, and toCol.
   */
  function arrowPathSpec(params) {
    var tail = getCoords(params.fromRow, params.fromCol);
    // TODO: subtract radius from length of arrow?
    var head = getCoords(params.toRow, params.toCol);
    // TODO: add "point" to head of arrow
    var result = Raphael.format("M{0},{1}L{2},{3}",
        tail[0], tail[1], head[0], head[1]);
    return result;
  }

  /**
   * Defines a custom Raphael method for generating and animating a
   * numbered circle.
   */
  Raphael.fn.numberedCircle = function(params) {
    var thisPaper = this;

    var obj = {};

    obj.params = params;

    var pt = getCoords(params.rowIndex, params.colIndex);
    obj.circleElement = thisPaper.circle(pt[0], pt[1], radius)
        .attr({fill: "#fff"});
    obj.numberElement = thisPaper.text(pt[0], pt[1], params.number);

    obj.animate = function(newParams, durationMs, easing, callback) {
      var dest = getCoords(newParams.rowIndex, newParams.colIndex);
      obj.circleElement.animate({cx: dest[0], cy: dest[1]},
          durationMs, easing, callback);
      obj.numberElement.animate({x: dest[0], y: dest[1]},
          durationMs, easing);

      var arrowStroke;
      if (newParams.arrowType == arrowTypes.pushLeft) {
        arrowStroke = "#c00";
      } else if (newParams.arrowType == arrowTypes.pushRight) {
        arrowStroke = "#00c";
      } else {
        arrowStroke = "#ccc";
      }
      var arrow = thisPaper.path(arrowPathSpec({
        fromRow: obj.params.rowIndex,
        fromCol: obj.params.colIndex,
        toRow: obj.params.rowIndex,
        toCol: obj.params.colIndex,
      })).attr({stroke: arrowStroke});
      arrow.toBack();
      arrow.animate({path: arrowPathSpec({
        fromRow: obj.params.rowIndex,
        fromCol: obj.params.colIndex,
        toRow: newParams.rowIndex,
        toCol: newParams.colIndex,
      })}, durationMs, easing);

      obj.params.rowIndex = newParams.rowIndex;
      obj.params.colIndex = newParams.colIndex;
    };

    obj.setNumber = function(newNumber) {
      obj.params.number = newNumber;
      obj.numberElement.attr("text", newNumber);
    };

    obj.customClone = function() {
      var paramsCopy = jQuery.extend({}, obj.params);
      return thisPaper.numberedCircle(paramsCopy);
    };

    return obj;
  }

  var maxRows = binomial(n, k);
  
  var gridWidth = 30;
  var gridHeight = 1.5 * gridWidth;
  var timeUnitMs = 100;
  var radius = 10;

  var paperWidth = (n+1) * gridWidth;
  var paperHeight = (maxRows+1) * gridHeight;
  var paper = Raphael("main", paperWidth, paperHeight);

  /**
   * Given the current state, trigger the next step of the animation.
   * This method will generate a chain of callbacks that will animate
   * the algorithm until it completes.
   */
  function getCallback(state) {
    if (state.subset == null) {
      // We've reached the final subset, so there are no more callbacks
      // to generate.
      return null;
    }
    return function() {
      var newSubset = nextSubset(n, k, state.subset);
      if (newSubset == null) {
        return;
      }

      var newCircles = [];
      for (var i = 0; i < state.circles.length; i++) {
        newCircles.push(state.circles[i].customClone());
      }

      var newRowIndex = state.rowIndex+1;

      var newState = {
        circles: newCircles,
        subset: newSubset,
        rowIndex: newRowIndex,
      };
      var callback = getCallback(newState);

      for (var i = 0; i < newCircles.length; i++) {
        var arrowType;
        if (i < newSubset.movedIndex) {
          arrowType = arrowTypes.pushLeft;
        } else if (i == newSubset.movedIndex) {
          arrowType = arrowTypes.pushRight;
        } else {
          arrowType = arrowTypes.dontTouch;
        }

        var number = newSubset.subset[i];
        newCircles[i].setNumber(number);
        newCircles[i].animate(
            {"rowIndex": newRowIndex, "colIndex": number - 1,
                "arrowType": arrowType},
            timeUnitMs, "linear",
            i == 0 ? callback : null);
      }
    }
  }
 
  var arrowTypes = {
    pushLeft: 0,
    pushRight: 1,
    dontTouch: 2,
  };
 
  var firstSubset = nextSubset(n, k, null);
  var circles = [];
  for (var i = 0; i < firstSubset.subset.length; i++) {
    var number = firstSubset.subset[i];
    var circle = paper.numberedCircle({
      rowIndex: 0,
      colIndex: number - 1,
      number: number,
    });
    circles.push(circle);
  }

  getCallback({rowIndex: 0, subset: firstSubset, circles: circles})();
}
