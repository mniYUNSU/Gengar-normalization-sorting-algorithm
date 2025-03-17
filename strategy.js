/**
 * 📌 배열을 무작위로 섞는 제너레이터 (Fisher-Yates Shuffle 알고리즘 사용)
 * - 배열을 랜덤하게 섞으면서, 현재 교환되는 인덱스를 반환하여 애니메이션에 활용할 수 있도록 한다.
 * - 각 단계에서 비교한 두 인덱스를 `compareIndexes`로 반환하여 시각적으로 강조 가능하다.
 *
 * @param {number[]} arr - 섞을 배열
 * @yields {object} 정렬 애니메이션을 위한 객체 반환
 *   - array: 현재 배열 상태 (복사본)
 *   - compareIndexes: 현재 비교한 두 개의 인덱스
 */
function* shuffleGenerator(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    // 0부터 i까지의 무작위 인덱스 j 선택
    const j = Math.floor(Math.random() * (i + 1));

    // 요소 교환 (i번째 요소와 j번째 요소 swap)
    [arr[i], arr[j]] = [arr[j], arr[i]];

    // 현재 배열 상태를 반환하면서, 비교한 두 인덱스를 함께 제공
    yield { array: [...arr], compareIndexes: [i, j] };
  }
}

/**
 * 📌 배열의 각 요소를 강조하는 제너레이터 (정렬 완료 시 강조 효과)
 * - 배열의 각 요소를 한 번씩 강조 표시하는 효과를 만든다.
 * - 강조된 인덱스를 `swappedIndexes`로 반환하여 시각적 효과를 줄 수 있다.
 * - 정렬이 끝난 후, 최종 상태의 배열을 한 번 더 반환한다.
 *
 * @param {number[]} arr - 강조할 배열
 * @yields {object} 애니메이션을 위한 객체 반환
 *   - array: 현재 배열 상태 (복사본)
 *   - swappedIndexes: 현재 강조할 인덱스
 */
function* accentGenerator(arr) {
  //compareIndexes 0~n까지 반환
  for (let i = 0; i < arr.length; i++) {
    // 현재 인덱스를 강조하는 상태를 반환
    yield { array: [...arr], swappedIndexes: [i] };
  }

  // 모든 요소 강조가 끝난 후, 최종 배열 상태 한 번 더 반환
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
