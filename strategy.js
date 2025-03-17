function* shuffleGenerator(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    yield { array: [...arr], compareIndexes: [i, j] };
  }
}

function* accentGenerator(arr) {
  //compareIndexes 0~n까지 반환
  for (let i = 0; i < arr.length; i++) {
    yield { array: [...arr], swappedIndexes: [i] };
  }
  yield { array: [...arr] };
}

/**
 * 병합 정렬(Merge Sort)
 * 분할 정복 알고리즘의 일종으로, 배열을 반으로 나누고, 각각을 정렬한 다음,
 * 정렬된 두 배열을 병합하여 전체를 정렬하는 방식으로 동작한다.
 *
 * == 병합 정렬의 작동 방식 ==
 * 1. 배열을 절반으로 나눈다.
 * 2. 나눈 배열을 재귀적으로 다시 병합 정렬을 적용한다.
 * 3. 정렬된 두 배열을 병합하여 하나의 배열로 만든다.
 * 4. 배열이 더 이상 나눌 수 없을 때까지 1~3 단계를 반복한다.
 */
const mergeSort = (function () {
  // 내부 함수로 merge를 정의하여 외부에 노출되지 않게 한다.
  function* merge(arr, left, mid, right, yieldCompare, stats) {
    const merged = [];
    let i = left,
      j = mid + 1;

    const initialArray = [...arr];

    while (i <= mid && j <= right) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i, j],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }
      if (arr[i] <= arr[j]) {
        merged.push(arr[i++]);
      } else {
        merged.push(arr[j++]);
      }
    }

    while (i <= mid) merged.push(arr[i++]);
    while (j <= right) merged.push(arr[j++]);

    // 병합한 결과를 원래 배열에 반영
    for (let k = left; k <= right; k++) {
      arr[k] = merged[k - left];
    }

    // 원래 배열과 병합된 배열 간의 차이를 바탕으로 swappedIndexes를 추출
    const swappedIndexes = [];
    for (let k = left; k <= right; k++) {
      if (arr[k] !== initialArray[k]) {
        swappedIndexes.push(k);
      }
    }

    if (yieldCompare && swappedIndexes.length > 0) {
      stats.swaps += swappedIndexes.length;
      yield {
        array: [...arr],
        swappedIndexes,
        compareIndexes: [],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
    }
  }

  // 병합 정렬의 재귀 함수
  function* mergeSortRecursive(arr, left, right, yieldCompare, stats) {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      yield* mergeSortRecursive(arr, left, mid, yieldCompare, stats);
      yield* mergeSortRecursive(arr, mid + 1, right, yieldCompare, stats);
      yield* merge(arr, left, mid, right, yieldCompare, stats);
    }
  }

  // 병합 정렬을 수행하는 메인 함수
  return function* mergeSort(arr, yieldCompare = true) {
    const stats = { comparisons: 0, swaps: 0 };
    yield* mergeSortRecursive(arr, 0, arr.length - 1, yieldCompare, stats);
    return arr;
  };
})();
