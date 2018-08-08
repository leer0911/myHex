const _ = {
  arrIntersect(arr1, arr2) {
    const intersectArr = [];
    for (let i = 0; i < arr1.length; i++) {
      for (let j = 0; j < arr2.length; j++) {
        if (arr2[j] == arr1[i]) {
          intersectArr.push(arr2[j]);
        }
      }
    }
    return intersectArr;
  },
  checkArrIsEqual: function(arr1, arr2) {
    for (var i = 0; i < arr1.length; i++) {
      if (arr2[i] != arr1[i]) {
        return false;
      }
    }
    return true;
  }
};

export default _;
