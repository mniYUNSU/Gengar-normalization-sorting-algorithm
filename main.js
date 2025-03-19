// 🎨 canvas 초기화 및 정렬 애니메이션 실행 함수
async function execute() {
  const canvas = document.getElementById('canvas');

  // 캔버스 크기를 브라우저 창 크기와 동일하게 설정
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  // 캔버스 컨텍스트 가져오기 (2D 그래픽 그리기)
  const context = canvas.getContext('2d');

  // 배경 이미지 로드
  const backgroundImage = './gengar.jpeg';
  const image = new Image();
  image.src = backgroundImage;

  // UI에서 입력된 정렬 속도 및 요소 개수 값 가져오기
  const frameDuration = document.querySelector('#frameDuration').value * 1;
  const slowInterval = document.querySelector('#slowInterval').value * 1;
  const fastInterval = document.querySelector('#fastInterval').value * 1;
  const slowN = document.querySelector('#slowN').value * 1;
  const fastN = document.querySelector('#fastN').value * 1;

  // UI 폼 제거 (사용자 입력이 끝났으므로 불필요한 요소 제거)
  document.getElementById('presetForm').remove();

  // 여러 정렬 알고리즘을 순차적으로 실행
  for (let [isEfficient, sortGen, sortGenName, sortGenNameJPN] of [
    [true, mergeSort, '병합 정렬', 'マージソート'],
    [false, selectionSort, '선택 정렬', '選択ソート'],
    [false, insertionSort, '삽입 정렬', '挿入ソート']
  ]) {
    // 정렬 알고리즘별로 처리할 데이터 개수와 애니메이션 속도 결정
    const n = isEfficient ? slowN : fastN;
    const interval = isEfficient ? slowInterval : fastInterval;

    // 캔버스 상단에 현재 정렬 알고리즘 이름 출력
    document.getElementById(
      'canvas-label'
    ).innerText = `${sortGenName}(${sortGen.name}, ${sortGenNameJPN})`;

    // 정렬할 배열 생성 (0부터 n-1까지)
    const arr = Array.from({ length: n }, (_, i) => i);

    // 배열을 섞어서 랜덤한 상태로 만들고 애니메이션 실행
    const shuffledArray = await animateSort({
      image,
      context,
      arr: [...arr],
      interval: slowInterval,
      frameDuration,
      generator: shuffleGenerator
    });

    await asleep(1000); // 1초 대기

    // 정렬 알고리즘 실행 및 애니메이션
    const sortedArray = await animateSort({
      yieldCompare: true,
      image,
      context,
      arr: shuffledArray,
      interval,
      frameDuration,
      generator: sortGen
    });

    // 정렬 완료 후 강조 효과 적용
    await animateSort({
      yieldCompare: true,
      image,
      context,
      arr: sortedArray,
      interval: fastInterval,
      frameDuration,
      generator: accentGenerator
    });

    await asleep(2000); // 2초 대기
  }

  console.log('done');
}

// 📌 이미지 섞기 및 정렬 후 다시 그리는 함수
function rearrangeImage({
  order, // 배열의 현재 순서
  image, // 배경 이미지
  context,
  width = context.canvas.width,
  height = context.canvas.height,
  colored = [] // 강조할 색상 정보
}) {
  const canvas = context.canvas;

  // 캔버스 크기 설정
  canvas.width = width;
  canvas.height = height;

  // 캔버스에 배경 이미지 그리기
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const segmentCount = order.length;
  const segmentWidth = Math.floor(canvas.width / segmentCount);
  const remainder = canvas.width % segmentCount;

  let segments = [];

  // 이미지를 잘라서 각 세그먼트(Canvas)로 저장
  let accumulatedWidth = 0;
  for (let i = 0; i < segmentCount; i++) {
    const currentSegmentWidth = i < remainder ? segmentWidth + 1 : segmentWidth;

    const segmentCanvas = document.createElement('canvas');
    segmentCanvas.width = currentSegmentWidth;
    segmentCanvas.height = canvas.height;
    const segmentCtx = segmentCanvas.getContext('2d');

    // 원본 이미지에서 특정 영역을 잘라서 복사
    segmentCtx.drawImage(
      canvas,
      accumulatedWidth,
      0,
      currentSegmentWidth,
      canvas.height,
      0,
      0,
      currentSegmentWidth,
      canvas.height
    );

    segments.push(segmentCanvas);
    accumulatedWidth += currentSegmentWidth;
  }

  // 기존 캔버스를 비우고 재구성
  context.clearRect(0, 0, canvas.width, canvas.height);

  accumulatedWidth = 0;
  for (let i = 0; i < segmentCount; i++) {
    const currentSegmentWidth = i < remainder ? segmentWidth + 1 : segmentWidth;
    const segmentIndex = order[i];
    const segment = segments[segmentIndex];

    // 새 배열 순서에 따라 세그먼트를 캔버스에 다시 그림
    context.drawImage(segment, accumulatedWidth, 0);

    // 🎯 숫자 추가 (각 segment의 원래 위치 표시)
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'white';
    context.font = '10px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const textX = accumulatedWidth + currentSegmentWidth / 2;
    const textY = 80;

    context.fillText(segmentIndex, textX, textY);

    accumulatedWidth += currentSegmentWidth;
  }

  // 강조된 색상 칠하기 (비교 중이거나 교환된 요소)
  for (const { indexes, color } of colored) {
    context.globalCompositeOperation = 'source-atop';
    context.fillStyle = color;
    indexes.forEach((index) => {
      const currentSegmentWidth =
        index < remainder ? segmentWidth + 1 : segmentWidth;
      const segmentXPosition = index * segmentWidth;
      context.fillRect(segmentXPosition, 0, currentSegmentWidth, canvas.height);
      context.globalCompositeOperation = 'source-over';
    });
  }
}

/**
 * 📌 정렬 애니메이션을 실행하는 함수
 * - 제너레이터(generator)를 사용하여 정렬 과정을 단계적으로 수행하며,
 *   배열의 상태를 업데이트하면서 시각적 애니메이션을 적용한다.
 * - 정렬 중 비교된 요소와 교환된 요소를 색상으로 표시하고,
 *   비교될 때마다 사운드를 재생하는 기능도 포함한다.
 *
 * @param {Object} params - 함수 매개변수
 * @param {HTMLImageElement} params.image - 배경 이미지
 * @param {CanvasRenderingContext2D} params.context - 캔버스 컨텍스트
 * @param {number[]} params.arr - 정렬할 배열
 * @param {number} params.interval - 정렬 애니메이션 프레임 간격 (ms)
 * @param {number} params.frameDuration - 한 프레임의 지속 시간 (ms)
 * @param {GeneratorFunction} params.generator - 정렬 알고리즘을 실행하는 제너레이터 함수
 * @param {boolean} params.yieldCompare - 비교 연산을 시각적으로 강조할지 여부
 * @returns {Promise<number[]>} - 정렬이 완료된 배열 반환
 */
async function animateSort({
  image,
  context,
  arr,
  interval,
  frameDuration,
  generator,
  yieldCompare
}) {
  let finalArray = [...arr]; // 최종 정렬된 배열
  let colorAndSoundQueue = []; // 색상 및 사운드를 적용할 큐 (애니메이션 단계 저장)
  const numStepsPerFrame = Math.ceil(frameDuration / interval); // 한 프레임당 실행할 단계 수
  let i = 0;

  // 🎯 정렬 과정 실행: 제너레이터(generator)를 통해 단계별 정렬 수행
  for (let result of generator(finalArray, yieldCompare)) {
    i++;
    if (i > 80000) break; // 실행 제한 (무한 루프 방지)

    // 제너레이터에서 반환된 정렬 상태 데이터 추출
    const {
      array, // 현재 배열 상태
      swappedIndexes = [], // 교환된 요소 인덱스
      compareIndexes = [], // 비교된 요소 인덱스
      comparisons, // 총 비교 횟수 (디버깅용)
      swaps // 총 교환 횟수 (디버깅용)
    } = result;

    // 애니메이션을 위한 색상 및 사운드 큐에 추가
    colorAndSoundQueue.push({
      array,
      colored: [
        { indexes: compareIndexes, color: 'rgba(255, 0, 0, 0.5)' }, // 비교 중인 요소 (빨강)
        { indexes: swappedIndexes, color: 'rgba(0, 255, 0, 0.5)' } // 교환된 요소 (초록)
      ],
      soundIndexes:
        compareIndexes.length === 0 ? swappedIndexes : compareIndexes // 사운드 재생할 인덱스
    });

    finalArray = array; // 최종 배열 업데이트
  }

  // 🎬 애니메이션 실행: 저장된 정렬 과정들을 순차적으로 실행
  while (colorAndSoundQueue.length > 0) {
    let combinedArray;
    let combinedColored = [];
    let combinedSoundIndexes = new Set();

    // 한 프레임에 여러 단계를 병합하여 실행
    for (
      let i = 0;
      i < numStepsPerFrame && colorAndSoundQueue.length > 0;
      i++
    ) {
      let { array, colored, soundIndexes } = colorAndSoundQueue.shift(); // 큐에서 단계 가져오기
      combinedArray = array; // 현재 배열 상태 업데이트
      combinedColored.push(...colored); // 비교/교환된 요소 색상 추가

      if (i === 0) {
        soundIndexes.forEach((index) => combinedSoundIndexes.add(index)); // 사운드 재생할 인덱스 저장
      }
    }

    // 현재 배열 상태를 캔버스에 다시 그림
    rearrangeImage({
      order: combinedArray,
      image,
      context,
      colored: combinedColored // 색상 정보 포함
    });

    // 현재 비교된 요소의 위치에 따라 사운드 재생
    playBeep({
      duration: Math.max(frameDuration, interval), // 사운드 지속 시간
      n: arr.length, // 배열 크기
      indexes: Array.from(combinedSoundIndexes), // 사운드 재생할 인덱스
      type: 'square' // 사운드 타입 (사각파)
    });

    // 프레임 간격만큼 대기 (애니메이션 효과)
    await asleep(Math.max(frameDuration, interval));
  }

  // 🎉 정렬이 끝난 후 최종 배열을 다시 그림
  rearrangeImage({ order: finalArray, image, context });

  return finalArray; // 최종 정렬된 배열 반환
}

// 🕒 일정 시간 대기하는 함수
function asleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let currentOscillators = [];
let audioContext;

// 🎵 사운드 재생 함수 (정렬 과정에서 비교되는 요소마다 소리 재생)
function playBeep({ duration, n, indexes, type = 'sine' }) {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  // 이전에 실행 중인 모든 oscillator를 정지
  currentOscillators.forEach((oscillator) => oscillator.stop());
  currentOscillators = []; // 배열 초기화
  // indexes 배열을 순회하며 각 음을 재생
  indexes.forEach((i) => {
    const frequency = calculateFrequency(n, i);

    // OscillatorNode 생성
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // GainNode 생성 (볼륨 조절)
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);

    // 노드 연결: Oscillator -> Gain -> Destination
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 소리 재생 시작 및 정지 예약
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);

    // 현재 oscillator를 배열에 추가
    currentOscillators.push(oscillator);
  });
}

function calculateFrequency(n, i) {
  // 듣기좋은 주파수 범위: 20Hz ~ 20kHz
  const minFrequency = 20;
  const maxFrequency = 6000;

  const frequency = minFrequency + (maxFrequency - minFrequency) * (i / n);
  return frequency;
}
