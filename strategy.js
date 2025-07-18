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

/**
 * 선택 정렬(Selection Sort)
 * 단순하지만 비효율적인 비교 기반 정렬 알고리즘이다.
 * 이 알고리즘은 배열을 순차적으로 정렬하면서
 * 각 단계에서 가장 작은 (또는 가장 큰) 요소를 선택하여
 * 해당 요소를 현재 정렬된 부분의 다음 위치로 이동시키는 방식으로 동작한다.
 * == 선택 정렬의 작동 방식==
 * 1. 주어진 배열에서 가장 작은 요소를 찾는다.
 * 2. 가장 작은 요소를 배열의 첫 번째 요소와 교환한다.
 * 3. 첫 번째 요소를 제외한 나머지 배열에서 다시 가장 작은 요소를 찾는다.
 * 4. 해당 요소를 배열의 두 번째 요소와 교환한다.
 * 5. 이 과정을 배열의 끝까지 반복한다.
 */
function* selectionSort(arr, yieldCompare = true) {
  let n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  let previousSwappedIndexes = [];

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: previousSwappedIndexes,
          compareIndexes: [i, j],
          comparisons,
          swaps
        };
      }

      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      swaps++;
      previousSwappedIndexes = [i, minIndex];

      yield {
        array: [...arr],
        swappedIndexes: previousSwappedIndexes,
        comparisons,
        swaps
      };
    }
  }

  yield {
    array: [...arr],
    comparisons,
    swaps
  };
}

/**
 * 삽입 정렬(Insertion Sort)
 * 또 다른 간단한 정렬 알고리즘으로,
 * 부분적으로 정렬된 배열과 정렬되지 않은 배열의 두 부분으로 나누어 처리한다.
 * 정렬되지 않은 부분에서 요소를 하나씩 가져와
 * 이미 정렬된 부분의 올바른 위치에 삽입하는 방식으로 동작한다.
 * == 삽입 정렬의 작동 방식 ==
 * 1. 두 번째 요소부터 시작하여 이전 요소들과 비교한다.
 * 2. 현재 요소보다 큰 요소가 있다면, 해당 요소들을 오른쪽으로 한 칸씩 이동시킨다.
 * 3. 현재 요소보다 작거나 같은 요소를 만나거나 배열의 시작 부분에 도달할 때까지 이동한다.
 * 4. 현재 요소를 비교 대상 요소의 바로 앞에 삽입한다.
 * 5. 모든 요소에 대해 1~4 단계를 반복한다.
 */
function* insertionSort(arr, yieldCompare = true) {
  let n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  let previousSwappedIndexes = [];

  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;

    while (j >= 0 && arr[j] > key) {
      comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: previousSwappedIndexes,
          compareIndexes: [j, j + 1],
          comparisons,
          swaps
        };
      }
      arr[j + 1] = arr[j];
      j = j - 1;
      swaps++;
      previousSwappedIndexes = [j + 1, j + 2];
    }
    arr[j + 1] = key;

    yield {
      array: [...arr],
      swappedIndexes: previousSwappedIndexes,
      comparisons,
      swaps
    };
  }

  yield {
    array: [...arr],
    comparisons,
    swaps
  };
}

/**
 * 이진 삽입 정렬(Binary Insertion Sort)
 * 삽입 정렬의 향상된 버전으로,
 * 정렬된 부분에서 현재 요소를 삽입할 위치를 찾을 때 이진 검색을 사용한다.
 * 이진 검색을 통해 삽입 위치를 찾는 데 걸리는 시간을 줄일 수 있지만,
 * 요소를 이동하는 데 드는 시간은 여전히 동일하므로 삽입 정렬보다 약간 빠르다.
 * == 이진 삽입 정렬의 작동 방식 ==
 * 1. 두 번째 요소부터 시작하여 이전 요소들과 비교한다.
 * 2. 이진 검색을 사용하여 현재 요소가 삽입될 위치를 찾는다.
 * 3. 삽입 위치까지의 요소들을 오른쪽으로 한 칸씩 이동시킨다.
 * 4. 현재 요소를 삽입 위치에 삽입한다.
 * 5. 모든 요소에 대해 1~4 단계를 반복한다.
 */
function* binaryInsertionSort(arr, yieldCompare = true) {
  let n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  let previousSwappedIndexes = [];

  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;

    // 이진 검색을 사용하여 삽입 위치 찾기
    let left = 0;
    let right = j;
    let insertIndex = i;

    while (left <= right) {
      comparisons++;
      let mid = Math.floor((left + right) / 2);
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: previousSwappedIndexes,
          compareIndexes: [mid, i],
          comparisons,
          swaps
        };
      }
      if (arr[mid] > key) {
        right = mid - 1;
        insertIndex = mid;
      } else {
        left = mid + 1;
      }
    }

    // 삽입 위치까지 요소들을 오른쪽으로 이동
    for (let k = j; k >= insertIndex; k--) {
      arr[k + 1] = arr[k];
      swaps++;
      previousSwappedIndexes = [k, k + 1];
    }

    // 현재 요소를 삽입 위치에 삽입
    arr[insertIndex] = key;

    yield {
      array: [...arr],
      swappedIndexes: previousSwappedIndexes,
      comparisons,
      swaps
    };
  }

  yield {
    array: [...arr],
    comparisons,
    swaps
  };
}

/**
 * 퀵 정렬(Quick Sort)
 * 분할 정복 알고리즘의 일종으로, 피벗을 선택하고 배열을 재배치하여
 * 피벗보다 작은 요소는 왼쪽에, 큰 요소는 오른쪽에 위치시킨다.
 * 그런 다음, 피벗을 기준으로 좌우 부분 배열에 대해 재귀적으로 동일한 작업을 반복한다.
 *
 * == 퀵 정렬의 작동 방식 ==
 * 1. 배열에서 피벗을 선택한다.
 * 2. 피벗을 기준으로 배열을 두 부분으로 나눈다.
 * 3. 피벗보다 작은 요소는 왼쪽에, 큰 요소는 오른쪽에 위치시킨다.
 * 4. 피벗을 제외한 두 부분 배열에 대해 재귀적으로 퀵 정렬을 적용한다.
 */

const quickSort = (function () {
  // 배열을 분할하고 피벗의 최종 위치를 반환하는 함수
  function* partition(arr, low, high, yieldCompare, stats) {
    const pivot = arr[high]; // 피벗 선택
    let i = low - 1; // 작은 요소의 마지막 인덱스

    for (let j = low; j < high; j++) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [j, high],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      if (arr[j] <= pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]]; // 요소 교환
        stats.swaps++;
        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [i, j],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }

    // 피벗을 올바른 위치로 이동
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    stats.swaps++;
    if (yieldCompare) {
      yield {
        array: [...arr],
        swappedIndexes: [i + 1, high],
        compareIndexes: [],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
    }

    return i + 1; // 피벗의 최종 위치 반환
  }

  // 퀵 정렬의 재귀 함수
  function* quickSortRecursive(arr, low, high, yieldCompare, stats) {
    if (low < high) {
      const pi = yield* partition(arr, low, high, yieldCompare, stats); // 분할 수행 및 피벗 위치 반환
      yield* quickSortRecursive(arr, low, pi - 1, yieldCompare, stats); // 왼쪽 부분 배열 정렬
      yield* quickSortRecursive(arr, pi + 1, high, yieldCompare, stats); // 오른쪽 부분 배열 정렬
    }

    if (yieldCompare) {
      yield {
        array: [...arr],
        swappedIndexes: [],
        compareIndexes: [],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
    }
  }

  // 퀵 정렬을 수행하는 메인 함수
  return function* quickSort(arr, yieldCompare = true) {
    const stats = { comparisons: 0, swaps: 0 };
    yield* quickSortRecursive(arr, 0, arr.length - 1, yieldCompare, stats);
    return arr;
  };
})();

/**
 * 버블 정렬(Bubble Sort)
 * 인접한 두 요소를 비교하여 작은 값을 앞으로 이동시키는 방식으로 동작하는 정렬 알고리즘이다.
 * 배열이 정렬될 때까지 반복하며, 가장 큰 값이 점차 뒤로 이동한다.
 *
 * == 버블 정렬의 작동 방식 ==
 * 1. 배열의 첫 번째 요소부터 시작하여 인접한 요소와 비교한다.
 * 2. 두 요소를 비교하여, 앞의 요소가 뒤의 요소보다 크면 위치를 교환한다.
 * 3. 배열 끝까지 비교를 반복하고, 그 과정에서 가장 큰 요소가 배열의 끝으로 이동한다.
 * 4. 배열이 정렬될 때까지 1~3 단계를 반복한다.
 */

function* bubbleSort(arr, yieldCompare = true) {
  const n = arr.length;
  let stats = { comparisons: 0, swaps: 0 };

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;

    for (let j = 0; j < n - 1 - i; j++) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [j, j + 1],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      // 인접 요소 비교 후 교환
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        stats.swaps++;

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [j, j + 1],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }

    // 교환이 한 번도 이루어지지 않으면 정렬이 완료된 것으로 간주하고 종료
    if (!swapped) break;
  }

  if (yieldCompare) {
    yield {
      array: [...arr],
      swappedIndexes: [],
      compareIndexes: [],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 칵테일 쉐이커 정렬(Cocktail Shaker Sort)
 * 버블 정렬의 변형으로, 양방향으로 배열을 순회하며 정렬하는 알고리즘이다.
 * 한 방향으로 끝까지 이동한 후, 반대 방향으로 다시 이동하면서 요소를 정렬한다.
 *
 * == 칵테일 쉐이커 정렬의 작동 방식 ==
 * 1. 배열의 왼쪽에서 오른쪽으로 이동하며 인접한 요소를 비교하고 교환한다.
 * 2. 끝까지 도달하면 방향을 반대로 바꿔 오른쪽에서 왼쪽으로 이동하며 다시 정렬한다.
 * 3. 배열이 정렬될 때까지 1~2 단계를 반복한다.
 */

function* cocktailShakerSort(arr, yieldCompare = true) {
  let start = 0;
  let end = arr.length - 1;
  let stats = { comparisons: 0, swaps: 0 };

  while (start < end) {
    let swapped = false;

    // 왼쪽에서 오른쪽으로 이동하며 정렬
    for (let i = start; i < end; i++) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i, i + 1],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        stats.swaps++;
        swapped = true;

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [i, i + 1],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }

    // 더 이상 교환이 없으면 정렬이 완료된 것으로 간주하고 종료
    if (!swapped) break;

    // 오른쪽 끝을 하나 줄임 (이미 정렬된 부분)
    end--;

    swapped = false;

    // 오른쪽에서 왼쪽으로 이동하며 정렬
    for (let i = end; i > start; i--) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i - 1, i],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      if (arr[i - 1] > arr[i]) {
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        stats.swaps++;
        swapped = true;

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [i - 1, i],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }

    // 더 이상 교환이 없으면 정렬이 완료된 것으로 간주하고 종료
    if (!swapped) break;

    // 왼쪽 끝을 하나 늘림 (이미 정렬된 부분)
    start++;
  }

  if (yieldCompare) {
    yield {
      array: [...arr],
      swappedIndexes: [],
      compareIndexes: [],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 놈 정렬(Gnome Sort)
 * 단순한 정렬 알고리즘으로, 삽입 정렬과 유사하게 동작하지만 인덱스를 양방향으로 이동하면서 정렬한다.
 * 정렬이 끝날 때까지 앞뒤로 이동하며 정렬이 되지 않은 부분을 정렬한다.
 *
 * == 놈 정렬의 작동 방식 ==
 * 1. 배열의 첫 번째 요소부터 시작하여 인접한 요소를 비교한다.
 * 2. 현재 요소가 이전 요소보다 작으면 두 요소의 위치를 교환하고, 인덱스를 감소시켜 다시 이전 요소와 비교한다.
 * 3. 그렇지 않으면 인덱스를 증가시켜 다음 요소로 이동한다.
 * 4. 배열의 끝에 도달할 때까지 2~3 단계를 반복한다.
 */

function* gnomeSort(arr, yieldCompare = true) {
  let index = 0;
  let stats = { comparisons: 0, swaps: 0 };

  while (index < arr.length) {
    if (index === 0) {
      index++;
    }

    stats.comparisons++;
    if (yieldCompare) {
      yield {
        array: [...arr],
        swappedIndexes: [],
        compareIndexes: [index - 1, index],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
    }

    if (arr[index] >= arr[index - 1]) {
      index++;
    } else {
      [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      stats.swaps++;

      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [index - 1, index],
          compareIndexes: [],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }
      index--;
    }
  }

  if (yieldCompare) {
    yield {
      array: [...arr],
      swappedIndexes: [],
      compareIndexes: [],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 콤 정렬(Comb Sort)
 * 버블 정렬의 개선된 버전으로, 큰 간격(gap)으로 요소를 비교하고 정렬하며,
 * 반복할 때마다 간격을 줄여 나가면서 정렬하는 방식으로 동작한다.
 * 마지막 단계에서 간격이 1이 되면 버블 정렬과 동일한 방식으로 동작한다.
 *
 * == 콤 정렬의 작동 방식 ==
 * 1. 초기 간격(gap)을 배열 길이로 설정한다.
 * 2. 간격을 점차 줄여가며 해당 간격으로 요소를 비교하고 교환한다.
 * 3. 간격이 1이 될 때까지 2번 단계를 반복한다.
 * 4. 간격이 1이 되면, 버블 정렬과 유사하게 동작하여 배열을 완전히 정렬한다.
 */

function* combSort(arr, yieldCompare = true) {
  const shrinkFactor = 1.3; // 간격을 줄이는 비율
  let gap = arr.length; // 초기 간격
  let sorted = false; // 정렬 여부 플래그
  let stats = { comparisons: 0, swaps: 0 };

  while (!sorted) {
    // 간격을 줄임
    gap = Math.floor(gap / shrinkFactor);
    if (gap <= 1) {
      gap = 1;
      sorted = true; // 간격이 1일 때, 마지막 패스임을 나타냄
    }

    let i = 0;
    while (i + gap < arr.length) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i, i + gap],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      // 요소를 비교하고 필요 시 교환
      if (arr[i] > arr[i + gap]) {
        [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
        stats.swaps++;
        sorted = false; // 교환이 발생하면 정렬되지 않았음을 나타냄

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [i, i + gap],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }

      i++;
    }
  }

  if (yieldCompare) {
    yield {
      array: [...arr],
      swappedIndexes: [],
      compareIndexes: [],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 셸 정렬(Shell Sort)
 * 삽입 정렬의 일반화된 버전으로, 간격(gap)을 두고 떨어진 요소들끼리 삽입 정렬을 수행한 후,
 * 점차 간격을 줄여가면서 전체 배열을 정렬하는 알고리즘이다.
 * 간격이 1이 되면 일반적인 삽입 정렬과 동일한 방식으로 동작한다.
 *
 * == 셸 정렬의 작동 방식 ==
 * 1. 초기 간격(gap)을 설정한다. 일반적으로 배열 길이의 절반으로 시작한다.
 * 2. 해당 간격으로 떨어진 요소들을 삽입 정렬한다.
 * 3. 간격을 줄이고 2번 단계를 반복한다.
 * 4. 간격이 1이 되면, 마지막으로 전체 배열을 삽입 정렬한다.
 */

function* shellSort(arr, yieldCompare = true) {
  let n = arr.length;
  let gap = Math.floor(n / 2);
  let stats = { comparisons: 0, swaps: 0 };

  while (gap > 0) {
    for (let i = gap; i < n; i++) {
      let temp = arr[i];
      let j = i;

      // 간격이 떨어진 요소들끼리 삽입 정렬
      while (j >= gap && arr[j - gap] > temp) {
        stats.comparisons++;
        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [],
            compareIndexes: [j, j - gap],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }

        arr[j] = arr[j - gap];
        stats.swaps++;
        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [j, j - gap],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }

        j -= gap;
      }

      arr[j] = temp;

      if (yieldCompare && j !== i) {
        yield {
          array: [...arr],
          swappedIndexes: [j],
          compareIndexes: [],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }
    }

    gap = Math.floor(gap / 2); // 간격을 줄임
  }

  if (yieldCompare) {
    yield {
      array: [...arr],
      swappedIndexes: [],
      compareIndexes: [],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 힙 정렬(Heap Sort)
 * 이진 힙(Binary Heap)을 이용한 정렬 알고리즘으로, 최대 힙을 구성하여 가장 큰 값을 배열의 끝으로 보내고,
 * 남은 부분을 다시 힙으로 구성해 정렬한다. O(n log n)의 시간 복잡도를 가지며, 안정 정렬은 아니다.
 *
 * == 힙 정렬의 작동 방식 ==
 * 1. 주어진 배열을 최대 힙으로 구성한다.
 * 2. 힙의 루트(최대값)를 배열의 끝으로 이동시킨다.
 * 3. 힙 크기를 줄이고, 남은 부분을 다시 최대 힙으로 재구성한다.
 * 4. 2~3 단계를 반복하여 배열이 정렬될 때까지 수행한다.
 */

function* heapSort(arr, yieldCompare = true) {
  let n = arr.length;
  let stats = { comparisons: 0, swaps: 0 };

  // 최대 힙을 구성하는 함수
  function* heapify(arr, n, i) {
    let largest = i; // 루트
    let left = 2 * i + 1; // 왼쪽 자식
    let right = 2 * i + 2; // 오른쪽 자식

    // 왼쪽 자식이 루트보다 크다면
    if (left < n && arr[left] > arr[largest]) {
      largest = left;
    }

    // 오른쪽 자식이 현재 가장 큰 값보다 크다면
    if (right < n && arr[right] > arr[largest]) {
      largest = right;
    }

    // 가장 큰 값이 루트가 아니라면
    if (largest !== i) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i, largest],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      stats.swaps++;

      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [i, largest],
          compareIndexes: [],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      // 재귀적으로 힙을 재구성
      yield* heapify(arr, n, largest);
    }
  }

  // 초기 배열을 최대 힙으로 변환
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(arr, n, i);
  }

  // 하나씩 요소를 힙에서 추출하여 정렬
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    stats.swaps++;

    if (yieldCompare) {
      yield {
        array: [...arr],
        swappedIndexes: [0, i],
        compareIndexes: [],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
    }

    yield* heapify(arr, i, 0);
  }

  if (yieldCompare) {
    yield {
      array: [...arr],
      swappedIndexes: [],
      compareIndexes: [],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 홀짝 정렬(Odd-Even Sort)
 *
 * 홀짝 정렬은 버블 정렬의 변형으로, 인접한 두 요소를 비교하여 정렬하지만
 * 번갈아 가며 홀수 인덱스 쌍과 짝수 인덱스 쌍을 비교하는 방식으로 동작한다.
 * 안정 정렬이며, 최악의 경우 시간 복잡도는 O(n^2)이다.
 *
 * == 홀짝 정렬의 작동 방식 ==
 * 1. 배열의 인접한 요소들을 번갈아 가며 홀수 인덱스 쌍과 짝수 인덱스 쌍으로 비교하고 교환한다.
 * 2. 배열이 완전히 정렬될 때까지 1번 단계를 반복한다.
 */

function* oddEvenSort(arr, yieldCompare = true) {
  let n = arr.length;
  let sorted = false;
  let stats = { comparisons: 0, swaps: 0 };

  while (!sorted) {
    sorted = true;

    // 홀수 인덱스 쌍 비교 및 정렬
    for (let i = 1; i < n - 1; i += 2) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i, i + 1],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        stats.swaps++;
        sorted = false;

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [i, i + 1],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }

    // 짝수 인덱스 쌍 비교 및 정렬
    for (let i = 0; i < n - 1; i += 2) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i, i + 1],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        stats.swaps++;
        sorted = false;

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [i, i + 1],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }
  }

  if (yieldCompare) {
    yield {
      array: [...arr],
      swappedIndexes: [],
      compareIndexes: [],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 바이토닉 정렬(Bitonic Sort)
 *
 * 바이토닉 정렬은 병렬 처리를 위해 설계된 비교 정렬 알고리즘으로,
 * O(log^2 n)의 시간 복잡도를 가진다. 이 알고리즘은 입력 배열을
 * 바이토닉 시퀀스로 정렬한 후, 그 시퀀스를 병합하여 전체를 정렬한다.
 *
 * == 바이토닉 정렬의 작동 방식 ==
 * 1. 입력 배열을 점차적으로 증가하는 부분과 감소하는 부분으로 나눈다.
 * 2. 각각의 부분을 재귀적으로 정렬한다.
 * 3. 정렬된 두 부분을 병합하여 하나의 정렬된 배열을 만든다.
 */
function* bitonicSort(arr, up = true, yieldCompare = true) {
  let n = arr.length;
  let stats = { comparisons: 0, swaps: 0 };

  // 두 부분을 병합하는 함수
  function* bitonicMerge(arr, low, cnt, up) {
    if (cnt <= 1) return;

    let mid = Math.floor(cnt / 2);
    for (let i = low; i < low + mid; i++) {
      stats.comparisons++;
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i, i + mid],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }

      if (arr[i] > arr[i + mid] === up) {
        [arr[i], arr[i + mid]] = [arr[i + mid], arr[i]];
        stats.swaps++;

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [i, i + mid],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }

    yield* bitonicMerge(arr, low, mid, up);
    yield* bitonicMerge(arr, low + mid, mid, up);
  }

  // 바이토닉 정렬 수행
  function* bitonicSortRec(arr, low, cnt, up) {
    if (cnt <= 1) return;

    let mid = Math.floor(cnt / 2);

    yield* bitonicSortRec(arr, low, mid, true);
    yield* bitonicSortRec(arr, low + mid, mid, false);

    yield* bitonicMerge(arr, low, cnt, up);
  }

  yield* bitonicSortRec(arr, 0, n, up);

  if (yieldCompare) {
    yield {
      array: [...arr],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * 사이클 정렬(Cycle Sort)
 *
 * 사이클 정렬은 배열 내에서 불필요한 복사 없이 최소 스왑 횟수로 정렬하는
 * 비교 기반 정렬 알고리즘이다. 사이클 정렬의 시간 복잡도는 O(n^2)이지만,
 * 각 요소를 정확히 한 번씩만 위치에 놓으므로 특정 상황에서 효율적이다.
 *
 * == 사이클 정렬의 작동 방식 ==
 * 1. 배열의 각 요소를 한 번씩 사이클로 위치를 찾아 이동시킨다.
 * 2. 각 사이클을 정리하면서 요소를 제자리에 위치시킨다.
 * 3. 필요하면 중복 요소를 건너뛰고 진행한다.
 */
function* cycleSort(arr, yieldCompare = true) {
  // 배열의 길이를 저장한다.
  let n = arr.length;
  // 비교 및 스왑 횟수를 추적하는 객체를 선언한다.
  let stats = { comparisons: 0, swaps: 0 };

  // 배열의 각 요소에 대해 사이클을 시작한다.
  for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
    // 현재 요소를 저장한다.
    let item = arr[cycleStart];
    // 현재 요소의 올바른 위치를 찾기 위해 위치를 추적한다.
    let pos = cycleStart;

    // 현재 요소보다 작은 요소의 개수를 센다.
    for (let i = cycleStart + 1; i < n; i++) {
      stats.comparisons++;
      if (arr[i] < item) {
        pos++;
      }

      // 배열의 상태를 외부로 전달하기 위해 yield한다.
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [],
          compareIndexes: [i],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }
    }

    // 요소가 이미 제자리에 있다면 다음 사이클로 넘어간다.
    if (pos === cycleStart) {
      continue;
    }

    // 동일한 요소가 있는 경우 위치를 건너뛰고 조정한다.
    while (item === arr[pos]) {
      pos++;
    }

    // 요소를 제자리에 놓고 스왑 횟수를 기록한다.
    if (pos !== cycleStart) {
      [arr[pos], item] = [item, arr[pos]];
      stats.swaps++;

      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [pos],
          compareIndexes: [],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }
    }

    // 남은 사이클을 계속 수행한다.
    while (pos !== cycleStart) {
      pos = cycleStart;

      // 현재 요소보다 작은 요소의 개수를 다시 센다.
      for (let i = cycleStart + 1; i < n; i++) {
        stats.comparisons++;
        if (arr[i] < item) {
          pos++;
        }

        // 배열의 상태를 외부로 전달하기 위해 yield한다.
        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [],
            compareIndexes: [i],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }

      // 동일한 요소가 있는 경우 위치를 건너뛰고 조정한다.
      while (item === arr[pos]) {
        pos++;
      }

      // 요소를 제자리에 놓고 스왑 횟수를 기록한다.
      if (item !== arr[pos]) {
        [arr[pos], item] = [item, arr[pos]];
        stats.swaps++;

        if (yieldCompare) {
          yield {
            array: [...arr],
            swappedIndexes: [pos],
            compareIndexes: [],
            comparisons: stats.comparisons,
            swaps: stats.swaps
          };
        }
      }
    }
  }

  // 최종적으로 정렬된 배열을 반환한다.
  if (yieldCompare) {
    yield {
      array: [...arr],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}

/**
 * LSD 기수 정렬(LSD Radix Sort)
 *
 * LSD 기수 정렬은 비교 기반이 아닌 정렬 알고리즘으로, 정수 또는 문자열을
 * 자리수(또는 문자)의 최하위부터 시작하여 정렬한다. 이 알고리즘은 안정적이며
 * O(nk)의 시간 복잡도를 가지며, 여기서 n은 숫자의 개수, k는 숫자의 최대 자릿수이다.
 *
 * == LSD 기수 정렬의 작동 방식 ==
 * 1. 배열의 각 숫자를 자릿수별로 분류한다.
 * 2. 각 자릿수마다 안정적인 계수 정렬(Counting Sort)을 사용해 정렬한다.
 * 3. 자릿수 순서대로 정렬된 배열을 얻을 때까지 반복한다.
 */
function* lsdRadixSort(arr, yieldCompare = true) {
  // 최대 자릿수를 찾기 위해 배열의 최대값을 확인한다.
  const maxNum = Math.max(...arr);
  // 최대 자릿수를 기반으로 반복 횟수를 결정한다.
  let exp = 1;
  let stats = { comparisons: 0, swaps: 0 };

  // 자릿수를 기반으로 반복하여 정렬한다.
  while (Math.floor(maxNum / exp) > 0) {
    // 계수 정렬을 위한 버킷을 초기화한다 (0~9).
    let output = new Array(arr.length).fill(0);
    let count = new Array(10).fill(0);

    // 각 자릿수에 따라 요소를 분류한다.
    for (let i = 0; i < arr.length; i++) {
      let digit = Math.floor(arr[i] / exp) % 10;
      yield {
        array: [...arr],
        swappedIndexes: [],
        compareIndexes: [i],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
      count[digit]++;
    }

    // 누적 카운트를 계산하여 위치를 결정한다.
    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
      yield {
        array: [...arr],
        swappedIndexes: [],
        compareIndexes: [],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
    }

    // 배열의 요소들을 자릿수에 따라 정렬된 위치에 배치한다.
    for (let i = arr.length - 1; i >= 0; i--) {
      let digit = Math.floor(arr[i] / exp) % 10;
      output[--count[digit]] = arr[i];
      yield {
        array: [...arr],
        swappedIndexes: [],
        compareIndexes: [i],
        comparisons: stats.comparisons,
        swaps: stats.swaps
      };
    }

    // 정렬된 결과를 원래 배열에 복사한다.
    for (let i = 0; i < arr.length; i++) {
      arr[i] = output[i];
      stats.swaps++;

      // 배열의 상태를 외부로 전달하기 위해 yield한다.
      if (yieldCompare) {
        yield {
          array: [...arr],
          swappedIndexes: [i],
          compareIndexes: [],
          comparisons: stats.comparisons,
          swaps: stats.swaps
        };
      }
    }

    // 다음 자릿수로 이동한다.
    exp *= 10;
  }

  // 최종적으로 정렬된 배열을 반환한다.
  if (yieldCompare) {
    yield {
      array: [...arr],
      comparisons: stats.comparisons,
      swaps: stats.swaps
    };
  }

  return arr;
}
