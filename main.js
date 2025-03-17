// canvas initialization
async function execute() {
  const canvas = document.getElementById('canvas');

  canvas.width = innerWidth;
  canvas.height = innerHeight;

  const context = canvas.getContext('2d');
  const backgroundImage = './gengar.jpeg';
  const image = new Image();
  image.src = backgroundImage;

  const frameDuration = document.querySelector('#frameDuration').value * 1;
  const slowInterval = document.querySelector('#slowInterval').value * 1;
  const fastInterval = document.querySelector('#fastInterval').value * 1;
  const slowN = document.querySelector('#slowN').value * 1;
  const fastN = document.querySelector('#fastN').value * 1;
  document.getElementById('presetForm').remove();

  for (let [isEfficient, sortGen, sortGenName, sortGenNameJPN] of [
    [true, mergeSort, '병합 정렬', 'マージソート']
  ]) {
    const n = isEfficient ? slowN : fastN;
    const interval = isEfficient ? slowInterval : fastInterval;
    //#canvas-label에 function 이름을 출력합니다.
    document.getElementById(
      'canvas-label'
    ).innerText = `${sortGenName}(${sortGen.name}, ${sortGenNameJPN})`;
    const arr = Array.from({ length: n }, (_, i) => i);

    const shuffledArray = await animateSort({
      image,
      context,
      arr: [...arr],
      interval: slowInterval,
      frameDuration,
      generator: shuffleGenerator
    });
    await asleep(1000);

    const sortedArray = await animateSort({
      yieldCompare: true,
      image,
      context,
      arr: shuffledArray,
      interval,
      frameDuration,
      generator: sortGen
    });
    await animateSort({
      yieldCompare: true,
      image,
      context,
      arr: sortedArray,
      interval: fastInterval,
      frameDuration,
      generator: accentGenerator
    });
    await asleep(2000);
  }

  console.log('done');
}

function rearrangeImage({
  order,
  image,
  context,
  width = context.canvas.width,
  height = context.canvas.height,
  colored = []
}) {
  const canvas = context.canvas;

  canvas.width = width;
  canvas.height = height;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const segmentCount = order.length;
  const segmentWidth = Math.floor(canvas.width / segmentCount);
  const remainder = canvas.width % segmentCount;

  let segments = [];

  let accumulatedWidth = 0;
  for (let i = 0; i < segmentCount; i++) {
    const currentSegmentWidth = i < remainder ? segmentWidth + 1 : segmentWidth;

    const segmentCanvas = document.createElement('canvas');
    segmentCanvas.width = currentSegmentWidth;
    segmentCanvas.height = canvas.height;
    const segmentCtx = segmentCanvas.getContext('2d');

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

  context.clearRect(0, 0, canvas.width, canvas.height);

  accumulatedWidth = 0;
  for (let i = 0; i < segmentCount; i++) {
    const currentSegmentWidth = i < remainder ? segmentWidth + 1 : segmentWidth;
    const segmentIndex = order[i];
    const segment = segments[segmentIndex];
    context.drawImage(segment, accumulatedWidth, 0);

    context.globalCompositeOperation = 'source-over';
    context.fillStyle = 'white';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const textX = accumulatedWidth + currentSegmentWidth / 2;
    const textY = 80;

    context.fillText(segmentIndex, textX, textY);

    accumulatedWidth += currentSegmentWidth;
  }

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

async function animateSort({
  image,
  context,
  arr,
  interval,
  frameDuration,
  generator,
  yieldCompare
}) {
  let finalArray = [...arr];
  let colorAndSoundQueue = [];
  const numStepsPerFrame = Math.ceil(frameDuration / interval);
  let i = 0;

  for (let result of generator(finalArray, yieldCompare)) {
    i++;
    if (i > 80000) break;
    const {
      array,
      swappedIndexes = [],
      compareIndexes = [],
      comparisons,
      swaps
    } = result;

    colorAndSoundQueue.push({
      array,
      colored: [
        { indexes: compareIndexes, color: 'rgba(255, 0, 0, 0.5)' },
        { indexes: swappedIndexes, color: 'rgba(0, 255, 0, 0.5)' }
      ],
      soundIndexes:
        compareIndexes.length === 0 ? swappedIndexes : compareIndexes
    });

    finalArray = array;
  }

  while (colorAndSoundQueue.length > 0) {
    let combinedArray;
    let combinedColored = [];
    let combinedSoundIndexes = new Set();

    for (
      let i = 0;
      i < numStepsPerFrame && colorAndSoundQueue.length > 0;
      i++
    ) {
      let { array, colored, soundIndexes } = colorAndSoundQueue.shift();
      combinedArray = array;
      combinedColored.push(...colored);
      if (i === 0) {
        soundIndexes.forEach((index) => combinedSoundIndexes.add(index));
      }
    }

    rearrangeImage({
      order: combinedArray,
      image,
      context,
      colored: combinedColored
    });
    playBeep({
      duration: Math.max(frameDuration, interval),
      n: arr.length,
      indexes: Array.from(combinedSoundIndexes),
      type: 'square'
    });
    await asleep(Math.max(frameDuration, interval));
  }

  rearrangeImage({ order: finalArray, image, context });
  return finalArray;
}

function asleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let currentOscillators = [];
let audioContext;

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
