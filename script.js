document.addEventListener('DOMContentLoaded', function() {
    // --- 요소 참조 ---
    const svg = document.getElementById('price-chart');
    const gridGroup = svg?.querySelector('.grid');
    const linePath = document.getElementById('price-line');
    const priceArea = document.getElementById('price-area'); // **** 추가 ****
    const flashEffect = document.getElementById('flashEffect');

    // New Scene Elements & App Container
    const initialStateContainer = document.getElementById('initial-state-container');
    const historyCard = document.getElementById('history-card');
    const holdingCard = document.getElementById('holding-card');
    const holdingValueElement = document.getElementById('holding-value');
    const holdingPercentageElement = document.getElementById('holding-percentage');
    const holdingQuantityElement = document.getElementById('holding-quantity');
    const scene2Container = document.getElementById('scene2-container');
    const scene2Header = document.getElementById('scene2-header');
    const scene2ChartWrapper = document.getElementById('scene2-chart-wrapper');
    const appContainer = document.getElementById('app-container');

    // 환율 상수 정의 (데모용)
    const USD_TO_KRW_RATE = 1350;

    // Check essential elements carefully
    const essentialElements = {
        svg, linePath, priceArea, flashEffect, initialStateContainer, historyCard,
        holdingCard, holdingValueElement, holdingPercentageElement, holdingQuantityElement, scene2Container,
        scene2Header, scene2ChartWrapper, appContainer
    };

    let missingElementKey = null;
    for (const key in essentialElements) {
        if (key !== 'gridGroup' && !essentialElements[key]) {
            missingElementKey = key;
            break;
        }
    }

    if (missingElementKey) {
        const errorMsg = `필수 HTML 요소 '<code>${missingElementKey}</code>'를 찾을 수 없습니다. ID나 HTML 구조를 확인하세요.`;
        console.error(errorMsg);
        if (appContainer) {
            appContainer.innerHTML = `<p style="color: red; text-align: center; margin-top: 50px;">오류: ${errorMsg} 애니메이션을 시작할 수 없습니다.</p>`;
        } else {
             alert("페이지 로딩 오류: 필수 요소를 찾을 수 없습니다.");
        }
        return;
    }
    if (!gridGroup) {
        console.warn("SVG grid group ('.grid')을 찾을 수 없습니다. 그리드가 표시되지 않을 수 있습니다.");
    }

    // --- 전역 변수 ---
    let chartWidth = 0;
    let chartHeight = 0;
    let animationFrameId = null;
    let lastTimestamp = 0;
    let timeAccumulator = 0; // 전체 애니메이션 경과 시간 추적용
    let dataTimeAccumulator = 0; // 데이터 업데이트 시점 결정용 누적 시간
    let currentPhase = 'IDLE'; // IDLE -> STAGE1_DISPLAY -> TRANSITION_TO_CHART -> CHART_ANIMATING -> TRANSITION_TO_FOCUS -> FOCUSED
    const initialInvestmentValue = 1000000; // 초기 투자 금액 (원)
    const initialTokenQuantity = 15000; // 초기 보유 토큰 수량 (예시)
    // 거래소 상장 시점 설정 (애니메이션 전체 시간 기준의 비율, 0.0~1.0)
    const listingPointRatio = 0.4; // 애니메이션 진행의 40% 지점에 상장 표시
    let listingLineElement = null; // 상장 라인 요소 참조
    let listingLabelElement = null; // 상장 레이블 요소 참조

    // --- 타이밍 및 설정값 ---
    const autoStartDelay = 1500; // 자동 시작 지연 시간 증가
    const historyFadeDuration = 500; // 히스토리 카드 사라지는 시간 (CSS transition과 일치)
    const cardMoveDuration = 700; // 보유 카드 이동 시간 (CSS transition과 일치)
    const chartAppearDelay = 300; // 차트 나타나는 지연 (카드 이동 시작 후)
    const refocusDelay = 500;    // 차트 사라진 후 카드 포커싱 지연

    // --- 데이터 관련 변수 ---
    let dataIndex = 0;
    let activeData = [];
    let fullData = []; // 이제 static 데이터로 채워짐
    let chartData = []; // timestamp와 price 포함한 전체 데이터
    let currentMinValue = 0;
    let currentMaxValue = 0;
    let targetMinValue = 0;
    let targetMaxValue = 0;
    let priceStart = 0; // 실제 데이터 로드 후 설정됨
    let pricePeak = 0; // 실제 데이터 로드 후 설정됨
    let actualMaxRoiPercentage = 0; // 실제 데이터 로드 후 설정됨
    let visibleDataPoints = 30; // 기본값, 데이터 로드 후 재설정될 수 있음
    let updateInterval = 50; // 애니메이션 속도 증가 (기존 80ms)
    let curveTension = 0.5;
    let totalChartDuration = 0; // 데이터 로드 후 계산됨
    let listingPointIndex = 0; // 데이터 로드 후 계산됨
    let initialDuration = 0; // 데이터 로드 후 계산됨

    // --- 데이터 보간 함수 ---
    function interpolateData(originalData, intervalMinutes = 5) {
        const interpolatedData = [];
        if (originalData.length < 2) return originalData; // 보간할 데이터 부족

        for (let i = 0; i < originalData.length - 1; i++) {
            const p1 = originalData[i];
            const p2 = originalData[i + 1];

            interpolatedData.push(p1); // 시작점 추가

            const timeDiff = p2.timestamp.getTime() - p1.timestamp.getTime();
            const priceDiff = p2.price - p1.price;
            const numIntervals = Math.round(timeDiff / (intervalMinutes * 60 * 1000));

            if (numIntervals <= 1) continue; // 이미 간격이 충분히 짧으면 건너뜀

            for (let j = 1; j < numIntervals; j++) {
                const ratio = j / numIntervals;
                const newTimestamp = new Date(p1.timestamp.getTime() + timeDiff * ratio);
                const newPrice = p1.price + priceDiff * ratio;
                // 약간의 노이즈 추가 (옵션)
                // const noise = (Math.random() - 0.5) * priceDiff * 0.05;
                // interpolatedData.push({ timestamp: newTimestamp, price: newPrice + noise });
                 interpolatedData.push({ timestamp: newTimestamp, price: newPrice });
            }
        }
        interpolatedData.push(originalData[originalData.length - 1]); // 마지막 점 추가
        console.log(`[Interpolate] Original: ${originalData.length} -> Interpolated: ${interpolatedData.length} points`);
        return interpolatedData;
    }

    // --- 상장 전 급등 효과 추가 함수 ---
    function addPreListingSurge(data, listingIndex, surgeDurationMinutes = 60, surgeFactor = 1.5) {
        const intervalMinutes = 5; // 보간 간격과 일치해야 함
        const surgeDurationPoints = surgeDurationMinutes / intervalMinutes;
        const surgeStartIndex = Math.max(0, listingIndex - surgeDurationPoints);

        if (surgeStartIndex >= listingIndex - 1 || surgeStartIndex < 0) {
             console.warn("[Surge] Cannot add surge, duration or index invalid.");
             return data; // 급등 구간이 너무 짧거나 인덱스 오류
        }


        const basePrice = data[surgeStartIndex].price;
        // 급등 직전(listingIndex-1)의 원래 보간된 가격을 기준으로 계산
        const originalTargetPrice = data[listingIndex - 1].price;
        const priceDiff = originalTargetPrice - basePrice;

        if (priceDiff <= 0) {
             console.warn("[Surge] Cannot add surge, price difference is not positive.");
             return data; // 가격 차이가 없거나 음수면 급등 효과 추가 불가
        }


        console.log(`[Surge] Adding surge from index ${surgeStartIndex} to ${listingIndex - 1}. Base: ${basePrice.toFixed(2)}, Target: ${originalTargetPrice.toFixed(2)}`);

        for (let i = surgeStartIndex + 1; i < listingIndex; i++) {
            const progress = (i - surgeStartIndex) / (listingIndex - 1 - surgeStartIndex); // 0 ~ 1 사이 진행률
             // Ease-in-out quadratic easing function
             const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
             const easedProgress = easeInOutQuad(progress); // 가속/감속 효과 적용

            // 가격 상승폭을 easedProgress 에 비례하게 적용
            const surgedPrice = basePrice + priceDiff * easedProgress * surgeFactor;

            // 원래 가격보다 낮아지지 않도록 보정
            data[i].price = Math.max(data[i].price, surgedPrice);
             // console.log(`[Surge] Index ${i}: Progress ${progress.toFixed(2)}, Eased ${easedProgress.toFixed(2)}, Price ${data[i].price.toFixed(2)}`);
        }

        return data;
    }

    // --- 데이터 로드 및 처리 ---
    function loadAndProcessData() {
        // --- 새로운 합성 rawData (2025-02-20 ~ 2025-02-28) ---
        const rawData = `
2025-02-20 12:00:00+00:00	1.45
2025-02-20 18:00:00+00:00	1.42
2025-02-21 00:00:00+00:00	1.40
2025-02-21 06:00:00+00:00	1.38
2025-02-21 12:00:00+00:00	1.35
2025-02-21 18:00:00+00:00	1.39
2025-02-22 00:00:00+00:00	1.41
2025-02-22 06:00:00+00:00	1.40
2025-02-22 12:00:00+00:00	1.43
2025-02-22 18:00:00+00:00	1.45
2025-02-23 00:00:00+00:00	1.48
2025-02-23 06:00:00+00:00	1.46
2025-02-23 12:00:00+00:00	1.50
2025-02-23 18:00:00+00:00	1.52
2025-02-24 00:00:00+00:00	1.55
2025-02-24 06:00:00+00:00	1.53
2025-02-24 12:00:00+00:00	1.58
2025-02-24 18:00:00+00:00	1.60
2025-02-25 00:00:00+00:00	1.62
2025-02-25 06:00:00+00:00	1.59
2025-02-25 12:00:00+00:00	1.65
2025-02-25 18:00:00+00:00	1.70
2025-02-26 00:00:00+00:00	1.80
2025-02-26 03:00:00+00:00	1.95
2025-02-26 06:00:00+00:00	2.10
2025-02-26 09:00:00+00:00	2.25
2025-02-26 12:00:00+00:00	2.40
2025-02-26 15:00:00+00:00	2.55
2025-02-26 18:00:00+00:00	2.65
2025-02-26 21:00:00+00:00	2.75
2025-02-27 00:00:00+00:00	2.80
2025-02-27 03:00:00+00:00	2.85
2025-02-27 06:00:00+00:00	2.90
2025-02-27 09:00:00+00:00	2.95
2025-02-27 12:00:00+00:00	3.00
2025-02-27 15:00:00+00:00	3.03
2025-02-27 18:00:00+00:00	3.05
2025-02-27 21:00:00+00:00	3.00
2025-02-28 00:00:00+00:00	2.95
`.trim();
        // --- 합성 rawData 끝 ---

        // 5분 단위 데이터 파싱 (탭으로 구분) -> 이제 위 rawData(6시간/3시간 간격) 사용
        const parsedData = rawData.split('\n').map(line => {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                const timestamp = new Date(parts[0]);
                const price = parseFloat(parts[1]);
                if (!isNaN(timestamp) && !isNaN(price)) {
                    return { timestamp, price };
                }
            }
            return null;
        }).filter(item => item !== null);

        if (parsedData.length < 2) {
             console.error("충분한 유효 5분 데이터가 없습니다. rawData 형식을 확인하세요.");
             return false;
        }

        // --- 데이터 스케일링 제거 --- 
        // const scaleA = 1.056;
        // const scaleB = 0.189;
        // const scaledData = parsed5MinData.map(item => ({
        //     ...item,
        //     price: Math.max(0, scaleA * item.price + scaleB) // Ensure price doesn't go below 0
        // }));
        // console.log(`[Data Scale] Applied linear scaling: price = ${scaleA} * original_price + ${scaleB}`);
        // --- 스케일링 제거 끝 ---

        // 15분 간격 데이터 필터링 (파싱된 데이터 사용, 스케일링 제거됨)
        // 참고: 이제 원본 데이터 간격이 길어서 15분 필터링하면 데이터가 거의 안 남을 수 있음.
        //       필터링 대신 보간을 사용하거나, 필터링 기준을 조정해야 할 수 있음.
        //       우선 15분 필터링 유지하고 결과 확인
        const filteredChartData = parsedData.filter(item => {
            const minutes = item.timestamp.getMinutes();
            return minutes % 15 === 0;
        });

        if (filteredChartData.length < 2) {
             console.error("15분 간격으로 필터링 후 데이터가 너무 적습니다.");
             // 필터링 없이 원본 5분 데이터 사용 고려 (선택 사항)
             // chartData = parsed5MinData;
             // console.warn("Using original 5-minute data due to insufficient filtered data.");
             return false; // 필터링 실패 시 중단
        }
        console.log(`[Data Filter] Original 5min: ${parsedData.length} -> Filtered 15min: ${filteredChartData.length} points`);


        // 데이터 보간 함수 호출 제거
        // let interpolatedChartData = interpolateData(originalChartData, 15);

        // 상장 시점 계산 (필터링된 15분 데이터 기준)
        // listingPointRatio 방식 대신 특정 날짜(2025-02-26 00:00:00) 기준으로 찾기
        const listingTimestampTarget = new Date('2025-02-26T00:00:00Z').getTime();
        listingPointIndex = filteredChartData.findIndex(d => d.timestamp.getTime() >= listingTimestampTarget);
        if (listingPointIndex === -1) {
             // 해당 타임스탬프가 없으면 중간 지점 사용 (fallback)
             listingPointIndex = Math.floor(filteredChartData.length / 2);
             console.warn("[Data Init] Listing timestamp not found exactly, using middle point as fallback.");
        } else {
             console.log(`[Data Init] Calculated Listing Point Index based on timestamp: ${listingPointIndex}`);
        }
        // listingPointIndex = Math.floor(filteredChartData.length * listingPointRatio); // 기존 방식 제거

        // 상장 전 급등 효과 추가 (필터링된 데이터에 적용)
        // 급등 시작점을 listingPointIndex 기준으로 조정 (예: listingPointIndex - 4)
        chartData = addPreListingSurge(filteredChartData, listingPointIndex, 60, 1.8); // 마지막 1시간, 1.8배 가속 유지 (효과 확인 필요)

        // 최종 데이터 및 관련 변수 설정 (chartData는 급등 적용된 필터링 데이터)
        fullData = chartData.map(d => d.price);
        priceStart = chartData[0].price;
        pricePeak = Math.max(...fullData);
        actualMaxRoiPercentage = Math.max(0, Math.round(((pricePeak - priceStart) / priceStart) * 100));
        console.log(`[Data Init] Using FILTERED(15min) & SURGED data. Length: ${chartData.length}, Start: ${priceStart.toFixed(2)}, Peak: ${pricePeak.toFixed(2)}, Actual Max ROI: ${actualMaxRoiPercentage}%`);
        console.log(`[Data Init] Listing Point Index: ${listingPointIndex}`);

        // 애니메이션 관련 시간 변수 재계산 (데이터 길이 변경됨)
        visibleDataPoints = 30; // 유지
        updateInterval = 50; // 유지
        curveTension = 0.5; // 유지

        totalChartDuration = (chartData.length > visibleDataPoints)
                                 ? (chartData.length - visibleDataPoints) * updateInterval
                                 : 0;
        initialDuration = listingPointIndex * updateInterval;

        console.log(`[Data Init] visiblePoints: ${visibleDataPoints}, updateInterval: ${updateInterval}ms, totalDuration: ${totalChartDuration}ms, initialDuration: ${initialDuration}ms`);
        return true; // 데이터 로드 및 처리 성공
    }


    // --- 데이터 초기화 함수 수정 ---
    function initializeData() {
        try {
            // fullData는 이미 chartData에서 로드됨
            if (fullData.length === 0) {
                console.error("Full data is empty, cannot initialize.");
                return false; // 데이터 없으면 초기화 실패
            }
            activeData = fullData.slice(0, visibleDataPoints);
            // 데이터가 visibleDataPoints보다 적으면 앞부분을 첫 데이터로 채움
            while (activeData.length < visibleDataPoints && activeData.length > 0 && fullData.length > 0) {
                 // fullData의 첫번째 값을 사용하거나, priceStart를 사용
                 activeData.unshift(fullData[0] ?? priceStart);
            }
             // activeData가 비어있는 예외 케이스 처리
             if (activeData.length === 0 && fullData.length > 0) {
                 activeData = Array(visibleDataPoints).fill(fullData[0] ?? priceStart);
                 console.warn("Active data was empty, filled with initial value.");
             }


            dataIndex = Math.min(visibleDataPoints, fullData.length); // 다음 로드할 데이터 인덱스

            if (activeData.length > 0) {
                const iB = getDataBounds(activeData);
                currentMinValue = iB.min;
                currentMaxValue = iB.max;
            targetMinValue = currentMinValue;
            targetMaxValue = currentMaxValue;
            } else {
                console.error("초기 activeData가 비어있습니다!");
                 currentMinValue = priceStart * 0.9;
                 currentMaxValue = priceStart * 1.1;
            targetMinValue = currentMinValue;
            targetMaxValue = currentMaxValue;
            }
            console.log(`[Data Init] Initialized. Active data length: ${activeData.length}, dataIndex: ${dataIndex}`);
            return true; // 초기화 성공
        } catch (e) {
            showError(`데이터 초기화 오류: ${e.message}`);
            return false; // 초기화 실패
        }
    }

    // --- 수익률 카드 업데이트 함수 수정 ---
    function updateHoldingCard(currentDataPoint) {
        // priceStart가 업데이트 되었으므로 계산 방식은 유효함
        if (!currentDataPoint || isNaN(currentDataPoint) || priceStart <= 0) { // priceStart 0 이하일 때 오류 방지
             // 안전한 기본값 또는 현재 값 사용
             currentDataPoint = activeData.length > 0 ? activeData[activeData.length - 1] : (priceStart > 0 ? priceStart : 1);
        }

        // currentPercentage 계산 시 새로운 priceStart 사용됨
         const currentPercentage = priceStart > 0
             ? Math.max(0, Math.round(((currentDataPoint - priceStart) / priceStart) * 100))
             : 0; // priceStart가 0이면 수익률 0
        const currentValue = Math.round(initialInvestmentValue * (1 + currentPercentage / 100));
        const profitAmount = Math.max(0, currentValue - initialInvestmentValue);

        holdingValueElement.textContent = `${formatNumber(currentValue)}원`;
        holdingPercentageElement.textContent = `(+${currentPercentage}%, +${formatNumber(profitAmount)}원)`;

        if (currentPercentage > 0) {
            holdingPercentageElement.classList.add('positive');
        } else {
            holdingPercentageElement.textContent = `(+0%, +0원)`;
            holdingPercentageElement.classList.remove('positive');
        }
    }

    // --- 헬퍼 함수 ---
    function formatNumber(num) { return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function showError(message) { console.error(message); }
    function setChartDimensions() { try{const rect = svg.getBoundingClientRect();if(!rect || rect.width<=0)return false;chartWidth=rect.width;const containerHeight = scene2ChartWrapper?.querySelector('.chart-container')?.clientHeight;chartHeight=containerHeight>0?containerHeight:200;svg.setAttribute('viewBox',`0 0 ${chartWidth} ${chartHeight}`);return true;}catch(e){showError(`차트 크기 설정 오류: ${e.message}`);return false;}}
    function drawGrid() { if(chartWidth===0||chartHeight===0)return;try{gridGroup.innerHTML='';const h=5,v=6;for(let i=0;i<=h;i++){const y=(i/h)*chartHeight,l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1','0');l.setAttribute('y1',String(y));l.setAttribute('x2',String(chartWidth));l.setAttribute('y2',String(y));gridGroup.appendChild(l);}for(let i=0;i<=v;i++){const x=(i/v)*chartWidth,l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',String(x));l.setAttribute('y1','0');l.setAttribute('x2',String(x));l.setAttribute('y2',String(chartHeight));gridGroup.appendChild(l);}}catch(e){showError(`그리드 그리기 오류: ${e.message}`);} }
    function scaleY(value, minValue, maxValue) { if(maxValue<=minValue)return chartHeight/2;const r=Math.max(maxValue-minValue,.01),sY=chartHeight-((value-minValue)/r)*chartHeight;return Math.max(0,Math.min(chartHeight,sY));}
    function getControlPoints(p0, p1, p2, p3, tension) { const t=tension,cp1x=p1.x+(p2.x-p0.x)/6*t,cp1y=p1.y+(p2.y-p0.y)/6*t,cp2x=p2.x-(p3.x-p1.x)/6*t,cp2y=p2.y-(p3.y-p1.y)/6*t;return[{x:cp1x,y:cp1y},{x:cp2x,y:cp2y}];}
    
    // **** generateCurvedPath 수정: line과 area 경로 객체 반환 ****
    function generateCurvedPath(data, minValue, maxValue, tension) {
        if (!data || data.length < 2 || chartWidth === 0 || chartHeight === 0) return { line: '', area: '' }; 
        try {
            const pts = data.map((d, i) => ({ x: (i / (visibleDataPoints - 1)) * chartWidth, y: scaleY(d === null ? (data[i - 1] ?? data[i + 1] ?? minValue) : d, minValue, maxValue) }));
            let lineP = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
            for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i === 0 ? 0 : i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
                const [cp1, cp2] = getControlPoints(p0, p1, p2, p3, tension);
                lineP += ` C ${cp1.x.toFixed(2)},${cp1.y.toFixed(2)} ${cp2.x.toFixed(2)},${cp2.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
            }

            // Area path generation
            let areaP = lineP; 
            if (pts.length > 1) {
                areaP += ` L ${pts[pts.length - 1].x.toFixed(2)} ${chartHeight}`; 
                areaP += ` L ${pts[0].x.toFixed(2)} ${chartHeight}`; 
                areaP += ' Z'; 
            }
            return { line: lineP, area: areaP };
        } catch (e) {
            showError(`곡선 경로 생성 오류: ${e.message}`);
            return { line: '', area: '' };
        }
    }
    
    function getDataBounds(data) { const vV=data.filter(d=>d!==null&&typeof d==='number'&&!isNaN(d));if(vV.length===0)return{min:priceStart*.95,max:priceStart*1.05};const min=Math.min(...vV),max=Math.max(...vV),pad=Math.max((max-min)*.1,.05);return{min:Math.max(0,min-pad),max:max+pad};}

    // **** generateFullStaticPath 수정: line과 area 경로 객체 반환 ****
    function generateFullStaticPath(fullChartData, minValue, maxValue, tension) {
        if (!fullChartData || fullChartData.length < 2 || chartWidth === 0 || chartHeight === 0) return { line: '', area: '' };
        try {
            const dataLength = fullChartData.length;
            const pts = fullChartData.map((price, i) => ({
                x: (i / (dataLength - 1)) * chartWidth, 
                y: scaleY(price, minValue, maxValue)
            }));
            let lineP = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
            for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i === 0 ? 0 : i - 1];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
                const [cp1, cp2] = getControlPoints(p0, p1, p2, p3, tension);
                lineP += ` C ${cp1.x.toFixed(2)},${cp1.y.toFixed(2)} ${cp2.x.toFixed(2)},${cp2.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
            }

            // Area path generation for static chart
            let areaP = lineP;
            if (pts.length > 1) {
                areaP += ` L ${pts[pts.length - 1].x.toFixed(2)} ${chartHeight}`; 
                areaP += ` L ${pts[0].x.toFixed(2)} ${chartHeight}`; 
                areaP += ' Z'; 
            }
            return { line: lineP, area: areaP };
        } catch (e) {
            showError(`전체 경로 생성 오류: ${e.message}`);
            return { line: '', area: '' };
        }
    }

    // --- 축 레이블 그리기 함수들 ---
    const yAxisLabelGroup = document.getElementById('y-axis-labels');
    const xAxisLabelGroup = document.getElementById('x-axis-labels');

    function drawYAxisLabels(minValue, maxValue) {
        // 애니메이션 중이거나 초기 상태일 때는 그리지 않음
        if (currentPhase === 'CHART_ANIMATING' || currentPhase === 'IDLE' || currentPhase === 'TRANSITION_TO_CHART') {
            if (yAxisLabelGroup) yAxisLabelGroup.innerHTML = '';
            return;
        }

        if (!yAxisLabelGroup || chartWidth === 0 || chartHeight === 0 || maxValue <= minValue) return;
        yAxisLabelGroup.innerHTML = ''; // 기존 레이블 클리어

        const minKRW = minValue * USD_TO_KRW_RATE;
        const maxKRW = maxValue * USD_TO_KRW_RATE;
        const rangeKRW = maxKRW - minKRW;

        // 코인마켓캡 스타일의 'Nice' 간격 계산 (500 단위 시도)
        const stepKRW = 500;

        if (rangeKRW <= 0 || stepKRW <= 0) return; // 유효하지 않은 범위나 간격이면 중단

        const startLabelKRW = Math.ceil(minKRW / stepKRW) * stepKRW;

        for (let currentLabelKRW = startLabelKRW; currentLabelKRW <= maxKRW; currentLabelKRW += stepKRW) {
            // 레이블 값(KRW)을 다시 USD로 변환하여 scaleY 함수에 사용
            const currentLabelUSD = currentLabelKRW / USD_TO_KRW_RATE;
            const y = scaleY(currentLabelUSD, minValue, maxValue);

            // Y축 경계를 약간 벗어나는 레이블도 포함 (5 -> -5, chartHeight - 5 -> chartHeight + 5)
            // 하지만 너무 벗어나면 제외 (예: y < -10 or y > chartHeight + 10)
            if (y < -10 || y > chartHeight + 10) continue;
            const clampedY = Math.max(5, Math.min(chartHeight - 5, y)); // 실제 위치는 경계 안으로 클램핑

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            // x 위치 계산 변경: SVG 너비(chartWidth) 대신 컨테이너 너비 기준으로 설정
            const containerWidth = svg.parentElement?.clientWidth ?? chartWidth; // 컨테이너 너비 가져오기 (없으면 chartWidth 사용)
            const labelX = containerWidth - 10; // 컨테이너 오른쪽 가장자리에서 10px 안쪽
            text.setAttribute('x', labelX);
            text.setAttribute('y', clampedY); // 클램핑된 y 위치 사용
            text.setAttribute('dy', '0.3em'); // 텍스트 세로 정렬 보정
            text.setAttribute('text-anchor', 'end'); // 텍스트 끝점 정렬 (오른쪽 정렬 효과)
            // 가격 포맷팅 (원화)
            text.textContent = `₩${formatNumber(Math.round(currentLabelKRW))}`;
            yAxisLabelGroup.appendChild(text);
        }
    }

    function drawXAxisLabels(isStatic = false) {
        if (!xAxisLabelGroup || chartWidth === 0 || chartHeight === 0 || chartData.length === 0) return;
        xAxisLabelGroup.innerHTML = ''; // 기존 레이블 클리어

        // 표시할 레이블 개수 증가 (3개 -> 5개)
        const labelCount = 5; 

        if (isStatic) {
            // 전체 데이터 기준 시간 표시 - 코인마켓캡 스타일로 수정
            const indices = [
                0,  // 첫 데이터
                Math.floor((chartData.length - 1) * 0.25),  // 25% 지점
                Math.floor((chartData.length - 1) * 0.5),   // 중간 지점
                Math.floor((chartData.length - 1) * 0.75),  // 75% 지점
                chartData.length - 1  // 마지막 데이터
            ];
            
            indices.forEach(index => {
                const x = (index / (chartData.length - 1)) * chartWidth;
                const adjustedX = Math.max(15, Math.min(chartWidth - 15, x));
                const timestamp = chartData[index]?.timestamp;
                if (!timestamp || isNaN(timestamp.getTime())) return;

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', adjustedX);
                text.setAttribute('y', chartHeight + 15);
                
                // 코인마켓캡 스타일 시간 포맷팅
                let timeStr = "";
                const hours = timestamp.getHours();
                const minutes = timestamp.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const hour12 = hours % 12 || 12;
                
                // 같은 날짜면 시간만, 다른 날짜면 날짜도 표시
                const today = new Date();
                const isToday = timestamp.getDate() === today.getDate() && 
                                timestamp.getMonth() === today.getMonth() &&
                                timestamp.getFullYear() === today.getFullYear();
                                
                if (isToday) {
                    timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                } else {
                    // 월/일 표시 (Apr 21 형식)
                    const month = timestamp.toLocaleString('en-US', { month: 'short' });
                    const day = timestamp.getDate();
                    timeStr = `${month} ${day}`;
                }
                
                text.textContent = timeStr;
                xAxisLabelGroup.appendChild(text);
            });
        } else {
            // 애니메이션 중: 현재 보이는 창 기준 -> 내용을 비워서 숨김
            xAxisLabelGroup.innerHTML = '';
        }
    }
    // --- 축 레이블 그리기 함수들 끝 ---

    // --- 거래소 상장 수직선 추가 함수 ---
    function setupListingLine() {
        const existingLine = document.querySelector('.listing-line');
        const existingLabel = document.querySelector('.listing-label');
        if (existingLine) existingLine.remove();
        if (existingLabel) existingLabel.remove();

        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;

        listingLineElement = document.createElement('div');
        listingLineElement.className = 'listing-line';

        listingLabelElement = document.createElement('div');
        listingLabelElement.className = 'listing-label';
        listingLabelElement.textContent = '거래소 상장';

        chartContainer.appendChild(listingLineElement);
        chartContainer.appendChild(listingLabelElement);
    }

    // --- 차트 인터랙션 설정 ---
    function setupChartInteraction() {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;

        const svgChart = document.getElementById('price-chart');
        const crosshairV = document.getElementById('crosshair-v');
        const crosshairH = document.getElementById('crosshair-h');
        if (!svgChart || !crosshairV || !crosshairH) {
            console.error("크로스헤어 라인 요소를 찾을 수 없습니다.");
            return;
        }

        // 기존 마커/정보 있으면 제거
        const existingMarker = chartContainer.querySelector('.point-marker');
        if (existingMarker) existingMarker.remove();
        const existingInfo = chartContainer.querySelector('.point-info');
        if (existingInfo) existingInfo.remove();


        const pointMarker = document.createElement('div');
        pointMarker.className = 'point-marker';
        pointMarker.style.display = 'none';

        const pointInfo = document.createElement('div');
        pointInfo.className = 'point-info';
        pointInfo.style.display = 'none';

        chartContainer.appendChild(pointMarker);
        chartContainer.appendChild(pointInfo);

        chartContainer.addEventListener('mousemove', function(e) {
            const rect = chartContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;

            let dataPointsAvailable;
            let sourceData; // 가격 데이터 소스
            let sourceTimeData; // 시간 데이터 소스
            let firstIndexOffset = 0; // 전체 데이터 기준 offset

            if (currentPhase === 'FOCUSED') {
                dataPointsAvailable = fullData.length;
                sourceData = fullData;
                sourceTimeData = chartData; // 시간은 chartData 사용
            } else if (currentPhase === 'CHART_ANIMATING') {
                dataPointsAvailable = activeData.length;
                sourceData = activeData;
                sourceTimeData = chartData; // 시간은 chartData 사용
                firstIndexOffset = Math.max(0, dataIndex - activeData.length);
            } else {
                return; // 다른 상태에서는 동작 안 함
            }

            if (x < 0 || x > chartWidth || dataPointsAvailable < 2) return;

            // 마우스 위치에 따른 데이터 인덱스 계산
            const indexRatio = x / chartWidth;
            const calculatedIndex = Math.floor(indexRatio * (dataPointsAvailable - 1));
            const actualDataIndex = Math.min(sourceTimeData.length - 1, firstIndexOffset + calculatedIndex);

            if (actualDataIndex < 0 || actualDataIndex >= sourceTimeData.length) return;

            const dataValue = sourceData[calculatedIndex]; // 가격은 해당 sourceData 사용
            const timestamp = sourceTimeData[actualDataIndex].timestamp;

            if (dataValue === null || isNaN(dataValue) || !timestamp || isNaN(timestamp.getTime())) return;

            let finalPercentage = null;
            if (currentPhase === 'FOCUSED' && actualDataIndex === chartData.length - 1) {
                 finalPercentage = actualMaxRoiPercentage;
                 // console.log(`[Interaction] Phase is FOCUSED and last point hovered. Using actual final ROI: ${finalPercentage}%`);
            }

            const minY = currentMinValue; // FOCUSED 상태에서도 마지막 min/max 사용
            const maxY = currentMaxValue;
            // Y 위치 계산 시 주의: FOCUSED 상태면 전체 데이터 기준 scale이어야 하지만,
            // 현재 scaleY는 전달된 min/max 기준이므로 애니메이션 마지막 상태의 Y가 계산됨.
            // 정적 차트 Y 위치를 정확히 계산하려면 scaleY 수정 또는 별도 계산 필요.
            // 여기서는 일단 크로스헤어/마커 위치를 위해 현재 방식 유지.
            const y = scaleY(dataValue, minY, maxY);


            const percentageChange = (finalPercentage !== null)
                ? finalPercentage
                : (priceStart > 0 ? Math.max(0, Math.round(((dataValue - priceStart) / priceStart) * 100)) : 0);

            pointMarker.style.left = `${x}px`;
            pointMarker.style.top = `${y}px`;
            pointMarker.style.display = 'block';

            const displayPriceKRW = dataValue * USD_TO_KRW_RATE;
            const displayDate = timestamp.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const displayTime = timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

            pointInfo.innerHTML = `
                <div class="info-line date-time-line">
                    <span>${displayDate}</span>
                    <span>${displayTime}</span>
                </div>
                <div class="info-line">
                    <span class="icon price-icon"></span>
                    <span>가격: ₩${formatNumber(Math.round(displayPriceKRW))}</span>
                </div>
                <div class="info-line percentage-line">
                     <span>(수익률: +${percentageChange}%)</span>
                </div>
            `;

            pointInfo.style.left = `${x}px`;
             const infoWidth = pointInfo.offsetWidth;
             const spaceRight = chartWidth - x;
             if (spaceRight < infoWidth + 10) {
                 pointInfo.style.transform = `translate(calc(-100% - 10px), 20px)`;
             } else {
                 pointInfo.style.transform = 'translate(-50%, 20px)';
             }
            pointInfo.style.top = `${y}px`;
            pointInfo.style.display = 'block';

            // 크로스헤어 업데이트 (FOCUSED 상태에서도 동작)
            crosshairV.setAttribute('x1', x);
            crosshairV.setAttribute('x2', x);
            crosshairV.setAttribute('y1', 0);
            crosshairV.setAttribute('y2', chartHeight);
            crosshairV.style.display = 'block';

            crosshairH.setAttribute('x1', 0);
            crosshairH.setAttribute('x2', chartWidth);
            crosshairH.setAttribute('y1', y);
            crosshairH.setAttribute('y2', y);
            crosshairH.style.display = 'block';
        });

        chartContainer.addEventListener('mouseleave', function() {
            pointMarker.style.display = 'none';
            pointInfo.style.display = 'none';
            crosshairV.style.display = 'none';
            crosshairH.style.display = 'none';
        });
    }

    // --- 차트 준비 함수 ---
    function prepareChart() {
        if (chartWidth === 0 || chartHeight === 0) {
            if (!setChartDimensions()) {
                console.warn("차트 준비: 차트 크기 설정 실패");
                return false;
            }
        }

        // **** SVG Gradient 추가 ****
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.insertBefore(defs, svg.firstChild); // grid 앞에 추가
        }
        if (!document.getElementById('area-gradient')) {
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', 'area-gradient');
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '0%');
            gradient.setAttribute('y2', '100%');
            // Use style attributes for stop colors for broader compatibility
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:var(--cta-primary); stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:var(--cta-primary); stop-opacity:0" />
            `;
            defs.appendChild(gradient);
        }
        // **** Gradient 추가 끝 ****

        drawGrid();

        // 데이터 로드/처리 후 축 레이블 그리기 (initializeData 내부에서 값 설정됨)
        if (activeData.length > 0) {
            drawYAxisLabels(currentMinValue, currentMaxValue);
            drawXAxisLabels();
        }

        setupListingLine();
        setupChartInteraction();

        return true;
    }

    // --- 메인 애니메이션 루프 (차트 전용) ---
    function animateChart(timestamp) {
        if (currentPhase !== 'CHART_ANIMATING') {
             if (animationFrameId) cancelAnimationFrame(animationFrameId);
             animationFrameId = null;
             return;
        }

        try {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            timeAccumulator += deltaTime;

            let needsDataUpdate = false;
            let chartAnimationShouldStop = false;

            dataTimeAccumulator += deltaTime;
            const dataPointsToAdvance = Math.floor(dataTimeAccumulator / updateInterval);

            if (dataPointsToAdvance > 0) {
                const targetDataIndex = dataIndex + dataPointsToAdvance;
                while (dataIndex < targetDataIndex && dataIndex < fullData.length) {
                    needsDataUpdate = true;
                    activeData.shift();
                    activeData.push(fullData[dataIndex]);
                    dataIndex++;
                }
                dataTimeAccumulator -= dataPointsToAdvance * updateInterval;
            }

            if (listingLineElement && listingLabelElement && chartWidth > 0 && activeData.length > 1) {
                const absoluteListingIndex = listingPointIndex;
                const windowStartIndex = Math.max(0, dataIndex - activeData.length);
                const relativeListingIndex = absoluteListingIndex - windowStartIndex;

                if (relativeListingIndex >= 0 && relativeListingIndex < activeData.length) {
                    const listingLineX = (relativeListingIndex / (activeData.length - 1)) * chartWidth;
                    listingLineElement.style.left = `${listingLineX}px`;
                    listingLabelElement.style.left = `${listingLineX}px`;
                    listingLineElement.style.display = 'block';
                    listingLabelElement.style.display = 'block';
                } else {
                    listingLineElement.style.display = 'none';
                    listingLabelElement.style.display = 'none';
                }
            }

            if (timeAccumulator >= initialDuration && !linePath.classList.contains('highlight')) {
                console.log("상승 구간 시작, 라인 하이라이트 (시간 기준)");
                linePath.classList.add('highlight');
            }

            const cardUpdateValue = (timeAccumulator < updateInterval && dataIndex <= visibleDataPoints)
                                  ? priceStart
                                  : (activeData.length > 0 ? activeData[activeData.length - 1] : priceStart);
            updateHoldingCard(cardUpdateValue);

            // 애니메이션 종료 조건 수정: dataIndex가 끝에 도달하면 종료
            if (dataIndex >= fullData.length && currentPhase === 'CHART_ANIMATING') { // Ensure phase check
                currentPhase = 'TRANSITION_TO_FOCUS'; // 전환 시작
                console.log("차트 애니메이션 종료, Fade Out/In 전환 시작");
                chartAnimationShouldStop = true; // Stop the requestAnimationFrame loop

                const lastDataPoint = fullData[fullData.length - 1];
                updateHoldingCard(lastDataPoint); // 최종 값으로 카드 업데이트

                // --- 최종 상태 계산 ---
                const finalBounds = getDataBounds(fullData);
                const { line: fullPath, area: fullAreaPath } = generateFullStaticPath(fullData, finalBounds.min, finalBounds.max, curveTension); // Destructure
                const finalListingX = (chartData.length > 1)
                                    ? (listingPointIndex / (chartData.length - 1)) * chartWidth
                                    : 0;

                // 1. 현재 차트 요소 Fade Out
                const fadeOutDuration = refocusDelay / 2; // 전환 시간 절반 사용
                anime({
                    targets: [linePath, priceArea, listingLineElement, listingLabelElement].filter(el => el), 
                    opacity: 0,
                    duration: fadeOutDuration,
                    easing: 'easeInOutSine', // 수정: 부드러운 이징 적용
                    complete: () => {
                        // 2. Fade Out 완료 후 즉시 최종 상태 설정
                        console.log("Fade Out 완료, 최종 상태 설정 및 Fade In 시작");
                        // 최종 값 설정
                        currentMinValue = finalBounds.min;
                        currentMaxValue = finalBounds.max;
                        // 최종 경로 설정
                        linePath.setAttribute('d', fullPath);
                        if (priceArea && fullAreaPath) priceArea.setAttribute('d', fullAreaPath); // **** Area 경로 설정 ****
                        if (priceArea) priceArea.classList.add('visible'); // **** Area 보이도록 클래스 추가 ****
                        
                        // 레이블 그룹 초기 투명도 설정 (그리기 전에)
                        if (yAxisLabelGroup) yAxisLabelGroup.style.opacity = 0;
                        if (xAxisLabelGroup) xAxisLabelGroup.style.opacity = 0;
                        
                        // 최종 축 그리기
                        drawYAxisLabels(currentMinValue, currentMaxValue);
                        drawXAxisLabels(true);
                        
                        // 최종 상장선 위치 설정 및 표시
                        if (listingLineElement && listingLabelElement) {
                            listingLineElement.style.left = `${finalListingX}px`;
                            listingLabelElement.style.left = `${finalListingX}px`;
                            listingLineElement.style.display = 'block';
                            listingLabelElement.style.display = 'block';
                        }

                        // 3. 최종 상태 요소 Fade In (레이블 그룹 포함)
                        anime({
                            targets: [linePath, priceArea, listingLineElement, listingLabelElement, yAxisLabelGroup, xAxisLabelGroup].filter(el => el),
                            opacity: 1, 
                            duration: fadeOutDuration, 
                            easing: 'easeInOutSine', // 수정: 부드러운 이징 적용
                            /* begin 콜백 제거 */
                            complete: () => {
                                console.log("Fade In 완료, 최종 FOCUSED 상태");
                                currentPhase = 'FOCUSED';
                            }
                        });
                    }
                });

                // 이전 anime.js 전환 로직 제거
                /* anime({... minY/maxY ...}); */
                /* anime({... linePath d ...}); */
                /* anime({... listing line left ...}); */
            }

             if (activeData.length > 0 && currentPhase === 'CHART_ANIMATING') { // Only update bounds if still animating
                const currentBounds = getDataBounds(activeData);
                targetMinValue = currentBounds.min;
                targetMaxValue = currentBounds.max;
                currentMinValue += (targetMinValue - currentMinValue) * curveTension * 0.5;
                currentMaxValue += (targetMaxValue - currentMaxValue) * curveTension * 0.5;
             }

            const needsRedraw = needsDataUpdate || Math.abs(targetMinValue - currentMinValue) > 0.001 || Math.abs(targetMaxValue - currentMaxValue) > 0.001;
            if (needsRedraw && activeData.length > 0) {
                const minY = currentMinValue;
                const maxY = currentMaxValue;

                const { line: newLinePath, area: newAreaPath } = generateCurvedPath(activeData, minY, maxY, curveTension); // Destructure
                if (newLinePath !== null && newAreaPath !== null) { // Check both paths
                    linePath.setAttribute('d', newLinePath);
                    if (priceArea) {
                        priceArea.setAttribute('d', newAreaPath); // **** Area 경로 업데이트 ****
                        // Only make area visible if it wasn't already (avoid CSS transition flash)
                        if (!priceArea.classList.contains('visible')) {
                             priceArea.classList.add('visible'); // **** Area 보이도록 클래스 추가 ****
                             // priceArea.style.opacity = 1; // **** 제거: CSS Transition에 맡김 ****
                        }
                    }
                } else {
                    console.warn("[animateChart] generateCurvedPath returned null.");
                }
                drawYAxisLabels(minY, maxY);
                drawXAxisLabels(false); // 애니메이션 중 X축 그리기 (isStatic = false)
            } else if (!needsRedraw) {
                 // console.log("[animateChart] Skipping redraw.");
             } else {
                  console.warn("[animateChart] Skipping redraw due to empty activeData.");
             }

            if (chartAnimationShouldStop) {
                console.log("[animateChart] Stopping animation loop.");
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            } else if (currentPhase === 'CHART_ANIMATING') { // Only request next frame if still animating
                animationFrameId = requestAnimationFrame(animateChart);
            }

        } catch (error) {
             showError(`차트 애니메이션 루프 오류: ${error.message}`);
             if (animationFrameId) cancelAnimationFrame(animationFrameId);
             animationFrameId = null;
             currentPhase = 'IDLE';
             initializeMasterAnimation(); // 루프 오류 시 초기화 시도
        }
    }

    // --- 전체 애니메이션 초기화 및 자동 시작 ---
    function initializeMasterAnimation() {
        console.log("initializeMasterAnimation: 시작");
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        currentPhase = 'IDLE';

        // 데이터 로드 및 처리 먼저 수행
        if (!loadAndProcessData()) {
             showError("데이터 로드 또는 처리에 실패하여 애니메이션을 시작할 수 없습니다.");
             // 오류 메시지 표시 등 사용자에게 알림
             if (appContainer) {
                 appContainer.innerHTML = `<p style="color: red; text-align: center; margin-top: 50px;">오류: 차트 데이터를 로드할 수 없습니다.</p>`;
             }
             return; // 데이터 로드 실패 시 중단
        }


        // 초기 상태 설정
        initialStateContainer.style.opacity = 1;
        historyCard.classList.remove('fade-out');
        historyCard.style.display = 'block';
        historyCard.style.opacity = 1;
        historyCard.style.transform = 'translateY(0)';
        holdingCard.classList.remove('move-down', 'refocus');
        holdingCard.style.opacity = 1;
        scene2Container.classList.remove('visible', 'fade-out');

        // 카드 내용 초기화 (데이터 로드 후 priceStart 사용)
        const initialValueBasedOnNewStart = initialInvestmentValue; // 시작값은 투자금 그대로
        holdingValueElement.textContent = `${formatNumber(initialValueBasedOnNewStart)}원`;
        holdingQuantityElement.textContent = `${formatNumber(initialTokenQuantity)} KAITO`;
        holdingPercentageElement.textContent = `(+0%, +0원)`;
        holdingPercentageElement.classList.remove('positive');

        // 차트 관련 요소 초기화
        linePath.setAttribute('d', ''); // Clear path
        linePath.style.opacity = 1; // Ensure line is visible initially
        if (priceArea) {
             priceArea.setAttribute('d', ''); // Clear area path
             priceArea.classList.remove('visible'); // Hide area initially
             priceArea.style.opacity = 0; // Ensure area starts hidden
        }
        linePath.classList.remove('highlight');
        if(gridGroup) gridGroup.innerHTML = '';
        if(xAxisLabelGroup) xAxisLabelGroup.innerHTML = '';
        if(yAxisLabelGroup) yAxisLabelGroup.innerHTML = '';

        // 차트 크기 설정 및 초기 그리기
        if (setChartDimensions()) {
            drawGrid();
             // 데이터 초기화 (activeData 및 min/max 값 설정)
            if (initializeData()) { // 초기화 성공 시 레이블 그림
                drawYAxisLabels(currentMinValue, currentMaxValue);
                drawXAxisLabels(false); // 초기 X축 (isStatic = false)
            } else {
                 console.warn("데이터 초기화 실패, 축 레이블 생략");
            }
            setupListingLine();
            console.log("차트 준비: 차트 크기 설정 성공");
        } else {
            console.warn("초기화 중 차트 크기 설정 실패, 그리드/상장라인 건너뜀");
        }


        console.log("initializeMasterAnimation: 초기화 완료, 자동 시작 타이머 설정");

        // 자동 시작 타이머 설정
            setTimeout(() => {
            console.log("자동 시작 타이머 콜백, 현재 Phase:", currentPhase);
            if (currentPhase !== 'IDLE') return;

            console.log("애니메이션 시작: 히스토리 숨김, 카드 이동, 차트 준비");
            currentPhase = 'TRANSITION_TO_CHART';

            // historyCard.classList.add('fade-out'); // 제거: anime.js로 제어
            holdingCard.classList.add('move-down');

            // 히스토리 카드를 anime.js로 동시에 사라지게 함
            anime({
                targets: historyCard,
                opacity: 0,
                translateY: 30, // 기존 fade-out 효과와 유사하게 약간 아래로 이동
                duration: cardMoveDuration, // 보유 카드 이동 시간과 동일하게 설정
                easing: 'easeInOutSine', // 부드러운 이징
                complete: () => {
                    historyCard.style.display = 'none'; // 애니메이션 후 완전히 숨김
                }
            });

            setTimeout(() => {
                scene2Container.classList.add('visible');
                console.log("차트 컨테이너 visible 추가");
            }, chartAppearDelay);

            setTimeout(() => {
                 if (currentPhase !== 'TRANSITION_TO_CHART') {
                     console.log("[Timer] Bailing: Phase is not TRANSITION_TO_CHART.");
                     return;
                 }

                 console.log("[Timer] 차트 애니메이션 시작 준비 (Static Data)");
            if (!setChartDimensions()) {
                     showError("차트 크기 설정 실패.");
                     initializeMasterAnimation();
                     return;
                 }
                 // 데이터 재초기화 (activeData 등 설정)
                 if (!initializeData()) {
                      showError("애니메이션 시작 시 데이터 초기화 실패.");
                      initializeMasterAnimation();
                 return;
            }

                 console.log("[Timer] 데이터 초기화 완료.");

                  // 차트 준비 호출 (내부에서 인터랙션 설정 포함)
                 if (!prepareChart()) {
                     showError("차트 준비 실패 (prepareChart).");
                     initializeMasterAnimation();
                     return;
                 }
                 console.log("[Timer] 차트 준비 완료.");

                 // Reset opacity before starting animation
                 linePath.style.opacity = 1;
                 if(priceArea) {
                     priceArea.style.opacity = 0; // Keep area hidden until first draw
                     priceArea.classList.remove('visible');
                 }

                 const { line: initialLinePath, area: initialAreaPath } = generateCurvedPath(activeData, currentMinValue, currentMaxValue, curveTension);
                 if (initialLinePath) {
                    linePath.setAttribute('d', initialLinePath);
                    // if (priceArea && initialAreaPath) priceArea.setAttribute('d', initialAreaPath); // Set initial area path but keep invisible
                    console.log("[Timer] Initial chart path set.");
                 } else {
                     showError("초기 라인 경로 생성 실패.");
                     initializeMasterAnimation();
                 return;
            }

                 console.log("[Timer] Setting phase to CHART_ANIMATING and requesting frame.");
                 currentPhase = 'CHART_ANIMATING';
            lastTimestamp = 0;
            timeAccumulator = 0;
                 dataTimeAccumulator = 0;
            animationFrameId = requestAnimationFrame(animateChart);
                 console.log("[Timer] Animation frame requested. ID:", animationFrameId);

            }, Math.max(historyFadeDuration, cardMoveDuration));

        }, autoStartDelay);
    }

    // --- Start the whole process ---
    initializeMasterAnimation();

    // --- 창 크기 변경 시 재초기화 ---
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
             console.log("창 크기 변경 - 애니메이션 재초기화");
             initializeMasterAnimation(); // 데이터 포함 전체 재초기화
         }, 250);
    });

    // --- 모달 관련 코드 (기존 유지) ---
    const preSignupBtn = document.querySelector('.pre-signup-btn');
    const modal = document.getElementById('signup-modal');
    const closeBtn = document.querySelector('.close-btn');
    const submitEmailBtn = document.getElementById('submit-email-btn');
    const emailInput = document.getElementById('email-input');
    if (preSignupBtn && modal && closeBtn && submitEmailBtn && emailInput) { preSignupBtn.addEventListener('click',()=>{modal.style.display='flex';if(typeof trackEvent==='function'){trackEvent('click_pre_signup',{'event_category':'conversion','event_label':'Open Signup Modal'});}});closeBtn.addEventListener('click',()=>{modal.style.display='none';});submitEmailBtn.addEventListener('click',()=>{const email=emailInput.value;if(validateEmail(email)){console.log('Email submitted:',email);alert('알림 신청이 완료되었습니다!');modal.style.display='none';emailInput.value='';if(typeof trackEvent==='function'){trackEvent('submit_email',{'event_category':'conversion','event_label':'Email Submitted'});}}else{alert('유효한 이메일 주소를 입력해주세요.');}});window.addEventListener('click',(event)=>{if(event.target===modal){modal.style.display='none';}}); } else { console.warn("모달 관련 요소 중 일부를 찾을 수 없습니다."); }

}); // End DOMContentLoaded

// --- 유틸리티 함수 (validateEmail, trackEvent - 이전과 동일) ---
function validateEmail(email) { const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; return re.test(String(email).toLowerCase()); }
function trackEvent(event_name, parameters) { if (typeof gtag === 'function') { gtag('event', event_name, parameters || {}); } else { console.log('gtag not defined, skipping trackEvent:', event_name); } }
