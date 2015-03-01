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
      return callbacks.moveDown(circleSet, numberSet, rowIndex);
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
  
  callbacks.moveDown = function(oldCircleSet, oldNumberSet, rowIndex) {
    if (rowIndex == maxRows-1) {
      return null;
    }
    return function() {
      var newCircleSet = oldCircleSet.clone();
      var newNumberSet = oldNumberSet.clone();
      var colIndex = 0;
      newCircleSet.forEach(function(el) {
        var callback = colIndex == 0 ? callbacks.moveDown(newCircleSet, newNumberSet, rowIndex+1) : null;
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
