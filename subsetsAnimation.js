function main() {

  function factorial(n) {
    if (n <= 0) {
      return 1;
    } else {
      return n * factorial(n-1);
    }
  }
  
  function binomial(n, k) {
    return factorial(n) / (factorial(k) * factorial(n-k));
  }

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

  function getCoords(row, col) {
    var cx = 1.5*radius + col * gridWidth;
    var cy = 1.5*radius + row * gridHeight;
    return [cx, cy];
  }

  Raphael.fn.numberedCircle = function(params) {
    var obj = {};

    obj.params = params;

    var pt = getCoords(params.rowIndex, params.colIndex);
    obj.circleElement = paper.circle(pt[0], pt[1], radius);
    obj.numberElement = paper.text(pt[0], pt[1], params.number);

    obj.animate = function(newParams, durationMs, easing, callback) {
      obj.params.rowIndex = newParams.rowIndex;
      obj.params.colIndex = newParams.colIndex;
      var dest = getCoords(newParams.rowIndex, newParams.colIndex);
      obj.circleElement.animate({cx: dest[0], cy: dest[1]},
          durationMs, easing, callback);
      obj.numberElement.animate({x: dest[0], y: dest[1]},
          durationMs, easing);
      // TODO: handle arrows here
    };

    obj.setNumber = function(newNumber) {
      obj.params.number = newNumber;
      obj.numberElement.attr("text", newNumber);
    };

    obj.customClone = function() {
      var paramsCopy = jQuery.extend({}, obj.params);
      return paper.numberedCircle(paramsCopy);
    };

    return obj;
  }

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
 
  function debug(msg) {
    debugElement.attr("text", msg);
  }
  
  var n = 6;
  var k = 3;
  var maxRows = binomial(n, k);
  
  var gridWidth = 30;
  var gridHeight = 1.5 * gridWidth;
  var timeUnitMs = 100;
  var radius = 10;

  var paperWidth = (n+1) * gridWidth;
  var paperHeight = (maxRows+1) * gridHeight;
  var paper = Raphael("main", paperWidth, paperHeight);
  
  var debugElement = paper.text(7*gridWidth, 7*gridHeight, "");
  
  var callbacks = {};
  
  callbacks.moveDown = function(state) {
    //console.log("moveDown state = " + JSON.stringify(state));
    if (state.subset == null) {
      // We've reached the final subset, so there are no more callbacks
      // to generate.
      return null;
    }
    console.log(state.subset.subset); // TODO: remove when done debugging
    console.log(state.subset.movedIndex); // TODO: remove when done debugging
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
      var callback = callbacks.moveDown(newState);

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

  callbacks.moveDown({rowIndex: 0, subset: firstSubset, circles: circles})();
}
