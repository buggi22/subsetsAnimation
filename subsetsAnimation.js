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
  
  var gridWidth = gridHeight = 30;
  var timeUnitMs = 1e2;
  
  var paper = Raphael("main", 0, 0, 800, 800);
  
  var debugElement = paper.text(7*gridWidth, 7*gridHeight, "");
  
  var radius = 10;
  var circle = paper.circle(1.5*radius /* cx */, 1.5*radius /* cy */, radius)
      .attr("fill", "#fff");
  var number = paper.text(1.5*radius, 1.5*radius, "1");
  
  var circleSet = paper.set();
  var numberSet = paper.set();

  var callbacks = {};
  
  callbacks.setup = function(oldCircle, oldNumber, colIndex, rowIndex) {
    circleSet.push(oldCircle);
    numberSet.push(oldNumber);
    if (colIndex == n-1) {
      var subset = nextSubset(n, k, null);
      return callbacks.moveDown(circleSet, numberSet, subset, rowIndex);
    }
    return function() {
      var newCircle = oldCircle.clone();
      var newNumber = oldNumber.clone();
      if (colIndex >= k-1) {
        newCircle.animate({"fill": "#ccc"}, timeUnitMs);
      }
      newCircle.animate(
          {"cx": newCircle.attr("cx") + gridWidth},
          timeUnitMs, "linear", callbacks.setup(newCircle, newNumber, colIndex+1, rowIndex));
      newNumber.attr("text", colIndex+2);
      newNumber.animate(
          {"x": newNumber.attr("x") + gridWidth},
          timeUnitMs, "linear", callbacks);
    };
  }
  
  callbacks.moveDown = function(oldCircleSet, oldNumberSet, oldSubset, rowIndex) {
    if (oldSubset == null) {
      return null;
    }
    console.log(oldSubset.subset); // TODO: remove when done debugging
    console.log(oldSubset.movedIndex); // TODO: remove when done debugging
    return function() {
      var newCircleSet = oldCircleSet.clone();
      var newNumberSet = oldNumberSet.clone();
      var newSubset = nextSubset(n, k, oldSubset);
      var colIndex = 0;
      newCircleSet.forEach(function(el) {
        var callback = colIndex == 0 ? callbacks.moveDown(newCircleSet, newNumberSet, newSubset, rowIndex+1) : null;
        el.animate(
            {"cy": el.attr("cy") + gridHeight},
            timeUnitMs, "linear", callback);
        colIndex++;
      });
      newNumberSet.forEach(function(el) {
        el.animate(
            {"y": el.attr("y") + gridHeight},
            timeUnitMs, "linear", null);
      });
    }
  }
  
  callbacks.setup(circle, number, 0, 0)();
}
