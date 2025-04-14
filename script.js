document.addEventListener('DOMContentLoaded', () => {
    // fadeInPop 애니메이션 키프레임 추가
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes fadeInPop {
            0% { 
                opacity: 0; 
                transform: scale(0.8);
            }
            50% { 
                opacity: 1; 
                transform: scale(1.1);
            }
            100% { 
                opacity: 1; 
                transform: scale(1);
            }
        }

        /* 카드 높이 트랜지션 부드럽게 만들기 */
        .card.selected {
            transition: transform 1.8s cubic-bezier(0.19, 1, 0.22, 1), 
                        opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1),
                        height 2s cubic-bezier(0.19, 1, 0.22, 1),
                        z-index 0s;
        }

        /* 카드 펼쳐지는 모션 더 부드럽게 */
        .route-section {
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        /* 스텝 경로 요소 트랜지션 */
        .route-step {
            position: relative;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .route-step.active {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* 체크마크 부드러운 트랜지션 */
        .step-icon-wrapper {
            transition: background-color 0.5s ease, transform 0.5s ease;
        }
        
        .step-icon-wrapper.checkmark {
            transition: background-color 0.5s ease, transform 0.3s ease;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(styleElement);

    // Screen 1 Elements
    const cardContainer = document.getElementById('card-container');
    const countdownTextElement = document.getElementById('countdown-text');
    const orderCompleteElement = cardContainer.querySelector('.order-complete'); // 기존 주문 완료 요소
    const paymentCompleteElement = cardContainer.querySelector('.payment-complete'); // 새로운 결제 완료 요소

    // Screen 2 Elements
    const percentageValueElement = document.querySelector('#screen2 .percentage-value');
    const graphLine = document.querySelector('#screen2 .graph-line');

    // Screen 3 Elements
    const screen3AmountValues = document.querySelectorAll('#screen3 .amount-value');

    // Slider Elements
    const sliderWrapper = document.getElementById('slider-wrapper');
    let currentScreen = 0; // 0, 1, 2

    // Data for the two stages
    const coinData = {
        'BTC': {
            name: '',
            price: 84000000, // 비트코인 가격 추가
            exchanges: [
                {
                    name: 'Binance',
                    iconClass: 'binance',
                    label: 'B',
                    savingsAmount: 42000, // 절약 금액 조정 (150000 -> 42000)
                    price: 83850000, // 거래소별 가격 추가
                    route: [
                        { key: 'imbank_transfer', title: 'IM뱅크 → 케이뱅크 송금', iconClass: 'imbank' },
                        { key: 'kbank_deposit_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_usdt', title: '업비트: USDT 구매', iconClass: 'upbit' },
                        { key: 'usdt_transfer_binance', title: 'USDT → 바이낸스 전송', iconClass: 'usdt' },
                        { key: 'binance_buy_target', title: '바이낸스: BTC 구매', iconClass: 'binance' }
                    ]
                },
                {
                    name: 'Upbit',
                    iconClass: 'upbit',
                    label: 'U',
                    savingsAmount: 28000, // 절약 금액 조정 (120000 -> 28000)
                    price: 84120000, // 거래소별 가격 추가
                    route: [
                        { key: 'kbank_transfer_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_target', title: `업비트: BTC 구매`, iconClass: 'upbit' }
                    ]
                },
                {
                    name: 'Coinone',
                    iconClass: 'coinone',
                    label: 'C',
                    savingsAmount: 22000, // 절약 금액 조정 (80000 -> 22000)
                    price: 84200000,
                    route: [
                        { key: 'kbank_transfer_coinone', title: '케이뱅크 → 코인원 입금', iconClass: 'kbank' },
                        { key: 'coinone_buy_target', title: '코인원: BTC 구매', iconClass: 'coinone' }
                    ]
                },
                {
                    name: 'Bithumb',
                    iconClass: 'bithumb',
                    label: 'B',
                    savingsAmount: 17000, // 절약 금액 조정 (50000 -> 17000)
                    price: 84350000,
                    route: [
                        { key: 'kbank_transfer_bithumb', title: '케이뱅크 → 빗썸 입금', iconClass: 'kbank' },
                        { key: 'bithumb_buy_target', title: '빗썸: BTC 구매', iconClass: 'bithumb' }
                    ]
                }
            ]
        },
        'ETH': {
            name: '이더리움',
            price: 3500000,
            exchanges: [
                {
                    name: 'Binance',
                    iconClass: 'binance',
                    label: 'B',
                    savingsAmount: 15000, // 절약 금액 조정 (45000 -> 15000)
                    price: 3455000,
                    route: [
                        { key: 'imbank_transfer', title: 'IM뱅크 → 케이뱅크 송금', iconClass: 'imbank' },
                        { key: 'kbank_deposit_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_usdt', title: '업비트: USDT 구매', iconClass: 'upbit' },
                        { key: 'usdt_transfer_binance', title: 'USDT → 바이낸스 전송', iconClass: 'usdt' },
                        { key: 'binance_buy_target', title: '바이낸스: ETH 구매', iconClass: 'binance' }
                    ]
                },
                {
                    name: 'Upbit',
                    iconClass: 'upbit',
                    label: 'U',
                    savingsAmount: 12000, // 절약 금액 조정 (30000 -> 12000)
                    price: 3470000,
                    route: [
                        { key: 'kbank_transfer_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_target', title: '업비트: ETH 구매', iconClass: 'upbit' }
                    ]
                },
                {
                    name: 'Coinone',
                    iconClass: 'coinone',
                    label: 'C',
                    savingsAmount: 8000, // 절약 금액 조정 (20000 -> 8000)
                    price: 3480000,
                    route: [
                        { key: 'kbank_transfer_coinone', title: '케이뱅크 → 코인원 입금', iconClass: 'kbank' },
                        { key: 'coinone_buy_target', title: '코인원: ETH 구매', iconClass: 'coinone' }
                    ]
                },
                {
                    name: 'OKX',
                    iconClass: 'okx',
                    label: 'O',
                    savingsAmount: 5000, // 절약 금액 조정 (15000 -> 5000)
                    price: 3485000,
                    route: [
                        { key: 'kbank_transfer_okx', title: '케이뱅크 → OKX 입금', iconClass: 'kbank' },
                        { key: 'okx_buy_target', title: 'OKX: ETH 구매', iconClass: 'okx' }
                    ]
                }
            ]
        },
        'BNB': {
            name: '버추얼 프로토콜',
            price: 560000,
            exchanges: [
                {
                    name: 'Bybit',
                    iconClass: 'bybit',
                    label: 'B',
                    savingsAmount: 25000, // 절약 금액 조정 (180000 -> 25000)
                    price: 550000,
                    route: [
                        { key: 'imbank_transfer', title: 'IM뱅크 → 케이뱅크 보내기', iconClass: 'imbank' },
                        { key: 'kbank_deposit_upbit', title: '케이뱅크 → 업비트 보내기', iconClass: 'kbank' },
                        { key: 'upbit_buy_usdt', title: '업비트에서 USDT 구매', iconClass: 'upbit' },
                        { key: 'usdt_transfer_bybit', title: 'USDT → 바이빗 보내기', iconClass: 'usdt' },
                        { key: 'bybit_buy_target', title: 'Bybit에서 카이토 구매', iconClass: 'bybit' }
                    ]
                },
                {
                    name: 'Uniswap v2',
                    iconClass: 'uniswap',
                    label: 'U',
                    savingsAmount: 20000, // 절약 금액 조정 (160000 -> 20000)
                    price: 570000,
                    route: [
                        { key: 'imbank_transfer', title: 'IM뱅크 → 케이뱅크 송금', iconClass: 'imbank' },
                        { key: 'kbbank_deposit_bithumb', title: '국민은행 → 빗썸 입금', iconClass: 'kbbank' },
                        { key: 'bithumb_buy_usdt', title: '빗썸: USDT 구매', iconClass: 'bithumb' },
                        { key: 'usdt_transfer_binance', title: 'USDT → Base 전송', iconClass: 'usdt' },
                        { key: 'uniswap_buy_target', title: 'Uniswap v2: 가상화폐 구매', iconClass: 'uniswap' }
                    ]
                },
                {
                    name: 'Upbit',
                    iconClass: 'upbit',
                    label: 'U',
                    savingsAmount: 15000, // 절약 금액 조정 (140000 -> 15000)
                    price: 580000,
                    route: [
                        { key: 'kbank_transfer_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_target', title: '업비트: 가상화폐 구매', iconClass: 'upbit' }
                    ]
                },
                {
                    name: 'Bitget',
                    iconClass: 'bitget',
                    label: 'B',
                    savingsAmount: 12000, // 절약 금액 조정 (130000 -> 12000)
                    price: 590000,
                    route: [
                        { key: 'imbank_transfer', title: 'IM뱅크 → 케이뱅크 송금', iconClass: 'imbank' },
                        { key: 'kbank_deposit_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_usdt', title: '업비트: USDT 구매', iconClass: 'upbit' },
                        { key: 'usdt_transfer_bitget', title: 'USDT → Bitget 전송', iconClass: 'usdt' },
                        { key: 'bitget_buy_target', title: 'Bitget: 가상화폐 구매', iconClass: 'bitget' }
                    ]
                }
            ]
        },
        'SOL': {
            name: '솔라나',
            price: 145000,
            exchanges: [
                {
                    name: 'Binance',
                    iconClass: 'binance',
                    label: 'B',
                    savingsAmount: 4800, // 절약 금액 조정 (12000 -> 4800)
                    price: 133000,
                    route: [
                        { key: 'imbank_transfer', title: 'IM뱅크 → 케이뱅크 송금', iconClass: 'imbank' },
                        { key: 'kbank_deposit_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_usdt', title: '업비트: USDT 구매', iconClass: 'upbit' },
                        { key: 'usdt_transfer_binance', title: 'USDT → 바이낸스 전송', iconClass: 'usdt' },
                        { key: 'binance_buy_target', title: '바이낸스: SOL 구매', iconClass: 'binance' }
                    ]
                },
                {
                    name: 'Upbit',
                    iconClass: 'upbit',
                    label: 'U',
                    savingsAmount: 3500, // 절약 금액 조정 (10000 -> 3500)
                    price: 135000,
                    route: [
                        { key: 'kbank_transfer_upbit', title: '케이뱅크 → 업비트 입금', iconClass: 'kbank' },
                        { key: 'upbit_buy_target', title: '업비트: SOL 구매', iconClass: 'upbit' }
                    ]
                },
                {
                    name: 'OKX',
                    iconClass: 'okx',
                    label: 'O',
                    savingsAmount: 2800, // 절약 금액 조정 (8000 -> 2800)
                    price: 137000,
                    route: [
                        { key: 'kbank_transfer_okx', title: '케이뱅크 → OKX 입금', iconClass: 'kbank' },
                        { key: 'okx_buy_target', title: 'OKX: SOL 구매', iconClass: 'okx' }
                    ]
                },
                {
                    name: 'Bithumb',
                    iconClass: 'bithumb',
                    label: 'B',
                    savingsAmount: 1500, // 절약 금액 조정 (5000 -> 1500)
                    price: 140000,
                    route: [
                        { key: 'kbank_transfer_bithumb', title: '케이뱅크 → 빗썸 입금', iconClass: 'kbank' },
                        { key: 'bithumb_buy_target', title: '빗썸: SOL 구매', iconClass: 'bithumb' }
                    ]
                }
            ]
        }
    };

    let currentCoin = 'BTC'; // Start with BTC

    // Updated routeIconMap with available images and fallbacks
    const routeIconMap = {
        'kbank': { class: 'kbank', label: 'K', image: 'images/kbank.png', name: '케이뱅크' },
        'kbbank': { class: 'kbbank', label: 'K', image: 'images/kbbank.png', name: '국민은행' },
        'upbit': { class: 'upbit', label: 'U', image: 'images/upbit.png', name: '업비트' },
        'binance': { class: 'binance', label: 'B', image: 'images/binance.png', name: '바이낸스' },
        'imbank': { class: 'imbank', label: 'I', image: 'images/imbank.png', name: 'IM뱅크' },
        'okx': { class: 'okx', label: 'O', image: 'images/okx.png', name: 'OKX' },
        'coinone': { class: 'coinone', label: 'C', image: 'images/coinone.png', name: '코인원' },
        'bithumb': { class: 'bithumb', label: 'B', image: 'images/bithumb.png', name: '빗썸' },
        'bybit': { class: 'bybit', label: 'B', image: 'images/bybit.jpg', name: '바이빗' },
        'uniswap': { class: 'uniswap', label: 'U', image: 'images/uniswap.png', name: 'Uniswap' },
        'bitget': { class: 'bitget', label: 'B', image: 'images/bitget.png', name: 'Bitget' },
        'usdt': { class: 'usdt', label: 'U', image: 'images/usdt.png', name: 'USDT' },
        'pancake': { class: 'pancake', label: 'P', image: 'images/pancake.png', name: 'Pancake' },
        // Fallback icons/labels for actions if needed, otherwise they use exchange icons via iconClass
        // 'transfer': { class: 'transfer', label: '→', name: '전송' },
        // 'buy': { class: 'buy', label: '$', name: '구매' },
    };

    let cardElements = [];
    let updateTimeoutId = null; // Changed from intervalId
    let countdownTimeoutId = null; // Changed from countdownIntervalId
    let selectCardTimeoutId = null; // Timeout for selecting card
    let countdown = 5; // Countdown set to 5 seconds (was 3)
    const animationDelay = 400; // ms, 카드 간 애니메이션 시간차
    // const transitionDuration = 1400; // ms, JS 타임아웃 지연 시간 - updateCards에서만 사용됨
    // let cardUpdateCycleStarted = false; // Flag removed

    function formatAmount(amount) {
        return amount.toLocaleString('ko-KR');
    }

    // 숫자 롤링 애니메이션 함수
    function animateCountUp(element, endValue, duration = 1400, isPercentage = false) {
        // Check if element exists
        if (!element) return;

        let startValueText = element.textContent.replace(/[^0-9.]/g, '');
        let startValue = isPercentage ? parseFloat(startValueText) : parseInt(startValueText, 10);
        if (isNaN(startValue)) startValue = 0;

        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            let currentValue;
            if (isPercentage) {
                // Handle floating point for percentage
                currentValue = (progress * (endValue - startValue) + startValue);
                 // Format to 1 decimal place if needed, or keep integer if possible
                element.textContent = Number.isInteger(currentValue) ? currentValue : currentValue.toFixed(1);
            } else {
                currentValue = Math.floor(progress * (endValue - startValue) + startValue);
                element.textContent = formatAmount(currentValue);
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }

    // Restore createCardElement to include animated-route div
    function createCardElement(exchange, cardId, coinSymbol) {
        const card = document.createElement('div');
        card.id = cardId;
        
        // 거래소 이름을 소문자로 변환하여 클래스 이름으로 사용
        const exchangeNameLower = exchange.name.toLowerCase().replace(/\s+/g, '-');
        card.className = `card card-${exchangeNameLower} hidden-below`;
        
        card.dataset.route = JSON.stringify(exchange.route);
        card.dataset.exchangeName = exchange.name;
        // price 데이터 속성 추가
        card.dataset.price = exchange.price;
        // 카드 높이 직접 설정 코드 제거 - 첫 단계에서는 기본 높이 유지

        const exchangeIconInfo = routeIconMap[exchange.iconClass] || { class: exchange.iconClass, label: exchange.label };
        const headerIconLabel = exchangeIconInfo.label || exchange.label || exchange.name.substring(0,1);
        const exchangeLogoContent = exchangeIconInfo.image
            ? `<img src="${exchangeIconInfo.image}" alt="${exchange.name} logo">`
            : `<span class="icon-placeholder">${headerIconLabel}</span>`;

        const staticRouteIconsHTML = exchange.route
             .filter(step => (step.iconClass || step.key) !== 'tether') // Keep filter just in case
             .slice(0, 5)
             .map((step, index) => {
                  const iconKey = step.iconClass || step.key;
                  const iconInfo = routeIconMap[iconKey];
                  const fallbackLabel = iconKey.substring(0,1).toUpperCase();
                  const iconContent = iconInfo && iconInfo.image
                      ? `<img src="${iconInfo.image}" alt="${iconKey}" style="width: 24px; height: 24px; object-fit: contain; display: block;">`
                      : `<span class="icon-placeholder" style="width: 24px; height: 24px; display: flex; justify-content: center; align-items: center;">${(iconInfo && iconInfo.label) || fallbackLabel}</span>`;
                  return `<div class="route-icon ${ (iconInfo && iconInfo.class) || 'default'}" style="z-index: ${index + 1};">${iconContent}</div>`;
             }).join('');

        // 첫 번째 카드인 경우 최저가 라벨 추가
        const isFirstCard = cardId === 'card1';
        const lowestPriceLabel = isFirstCard ? '<span class="lowest-price-label" style="background-color:#1d74ff; color:white; font-size:12px; padding:4px 8px; border-radius:6px; margin-left: 10px; opacity: 0.9; transition: opacity 1.2s ease;">최저가</span>' : '';
        
        // 카드별 레이아웃 차이점
        if (isFirstCard) {
            // 첫 번째 카드 - 좌측 정렬로 통일된 레이아웃
            card.innerHTML = `
                <div class="card-layout" style="display:flex; flex-direction:column; height:100%;">
                    <!-- 헤더 영역 -->
                    <div class="card-header" style="flex-shrink:0; margin-bottom:0;">
                        <div class="exchange-info"> 
                             <div class="exchange-icon ${exchangeIconInfo.class}">${exchangeLogoContent}</div>
                             <div class="exchange-name">${exchange.name}${lowestPriceLabel}</div>
                        </div>
                         <div class="route-icons static-route-icons">
                             ${staticRouteIconsHTML}
                         </div>
                    </div>
                    
                    <!-- 가격 정보 영역 - 좌측 정렬로 통일, 여백 더 줄임 -->
                    <div class="price-section" style="margin-top:5px; text-align:left; flex-shrink:0; margin-bottom:0;">
                        <div class="price-info" style="font-size:20px; font-weight:bold;">${formatAmount(exchange.price)}원</div>
                        <div class="amount-saved" style="font-size:14px; color:#666; margin-top:35px; visibility:visible;">최대 <span class="amount-value">${formatAmount(exchange.savingsAmount)}</span>원 절약해요</div>
                    </div>
                    
                    <!-- 경로 정보 영역 - 스크롤 없이 표시, 음수 마진으로 위로 당김 -->
                    <div class="route-section" style="flex-grow:0; position:relative; margin-top:-25px;">
                        <div class="animated-route" style="padding-top:0;"></div>
                    </div>
                </div>
            `;
        } else {
            // 2~4번째 카드 - 간소화된 레이아웃
            card.innerHTML = `
                <div class="card-layout" style="display:flex; flex-direction:column; height:100%;">
                    <!-- 헤더 영역 -->
                    <div class="card-header" style="flex-shrink:0; margin-bottom:0;">
                        <div class="exchange-info"> 
                             <div class="exchange-icon ${exchangeIconInfo.class}">${exchangeLogoContent}</div>
                             <div class="exchange-name">${exchange.name}</div>
                        </div>
                         <div class="route-icons static-route-icons">
                             ${staticRouteIconsHTML}
                         </div>
                    </div>
                    
                    <!-- 간소화된 가격 정보 영역 -->
                    <div class="price-section" style="margin-top:10px; text-align:left;">
                        <div class="price-info" style="font-size:20px; font-weight:bold;">${formatAmount(exchange.price)}원</div>
                    </div>
                    
                    <!-- 경로 정보 영역 (애니메이션용) -->
                    <div class="route-section" style="display:none;">
                        <div class="animated-route"></div>
                    </div>
                </div>
            `;
        }

        requestAnimationFrame(() => {
            const amountElement = card.querySelector('.amount-value');
            if (amountElement) { amountElement.textContent = formatAmount(0); }
        });
        return card;
    }

    // Restore animateRoute function to run inside cardElement
    function animateRoute(cardElement) {
        console.log(`animateRoute called for card: ${cardElement.id}`);
        const routeContainer = cardElement.querySelector('.animated-route');
        const staticIconsContainer = cardElement.querySelector('.static-route-icons');
        if (!routeContainer) {
            console.error("animateRoute exiting: .animated-route not found inside", cardElement.id);
            return;
        }
        if (staticIconsContainer) { staticIconsContainer.style.display = 'none'; }
        
        routeContainer.innerHTML = '';
        const route = JSON.parse(cardElement.dataset.route || '[]');

        // 주문 완료 단계 추가 (새로운 단계 추가)
        const completeStep = {
            iconClass: 'checkmark',
            key: 'order_complete',
            title: '주문 완료!'
        };
        route.push(completeStep);

        route.forEach((step, index) => {
            const iconKey = step.iconClass || step.key;

            // Skip if no key or special skip condition
            if (!iconKey) return;

            const stepElement = document.createElement('div');
            stepElement.classList.add('route-step');
            
            // 처음부터 스타일 적용
            stepElement.style.opacity = '0.5';
            stepElement.style.transform = 'translateY(10px)';
            stepElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            // Determine icon content based on step type
            let iconContent = '';
            let iconWrapperClass = '';
            
            const iconInfo = routeIconMap[iconKey];
            const fallbackLabel = iconKey.substring(0, 1).toUpperCase();

            if (iconKey === 'checkmark') {
                // 체크마크 단계 (주문 완료) - 초기에는 일반 스타일(회색)로 시작
                iconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="7 13 10.5 16 17 9"></polyline>
                </svg>`;
                // 'complete' 클래스 제거 - 기본 스타일(회색)로 시작
                iconWrapperClass = '';
            } else {
                // 일반 아이콘 단계 (거래소, 지갑 등)
                iconContent = iconInfo && iconInfo.image
                    ? `<img src="${iconInfo.image}" alt="${iconKey}" style="width: 24px; height: 24px; object-fit: contain; display: block;">`
                    : `<span class="icon-placeholder" style="width: 24px; height: 24px; display: flex; justify-content: center; align-items: center;">${(iconInfo && iconInfo.label) || fallbackLabel}</span>`;
                iconWrapperClass = (iconInfo && iconInfo.class) || 'default';
            }

            stepElement.innerHTML = `
                <div class="step-indicator">
                     <div class="step-icon-wrapper ${iconWrapperClass}">${iconContent}</div>
                     ${index < route.length - 1 ? '<div class="step-line"></div>' : ''}
                </div>
                <div class="step-details">
                    <div class="step-title" style="color: var(--text-color-1-w);">${step.title}</div>
                </div>
            `;
            routeContainer.appendChild(stepElement);
            
            // 각 단계 요소를 순차적으로 페이드인 (더 빠르게)
            setTimeout(() => {
                stepElement.style.opacity = '1';
                stepElement.style.transform = 'translateY(0)';
            }, 150 + index * 70); // 200ms -> 150ms, 100ms -> 70ms로 더 빠르게
        });

        // Animate focus moving through steps
        const stepElements = routeContainer.querySelectorAll('.route-step');
        let currentStepIndex = 0;
        const stepInterval = 350; // 500ms -> 350ms로 더 빠르게
        let stepTimeoutId = null;

        function focusNextStep() {
            // Clear previous timeout if exists
            if (stepTimeoutId) clearTimeout(stepTimeoutId);

            // 현재 단계를 활성화 및 완료 표시
            if (currentStepIndex < stepElements.length) {
                const currentStep = stepElements[currentStepIndex];
                
                // 1단계: 먼저 활성화 클래스만 추가 (아이콘 포커싱)
                currentStep.classList.add('active');
                
                // 2단계: 체크마크 표시 (더 빠르게)
                setTimeout(() => {
                    // 체크마크로 변경
                    const iconWrapper = currentStep.querySelector('.step-icon-wrapper');
                    if (iconWrapper) {
                        // PNG 이미지 대신 인라인 SVG 사용
                        iconWrapper.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="7 13 10.5 16 17 9"></polyline>
                            </svg>
                        `;
                        iconWrapper.classList.add('checkmark');
                    }
                    
                    // 3단계: 체크마크 표시 후 완료 상태로 전환 (더 빠르게)
                    setTimeout(() => {
                        // 완료 클래스 추가 (선 애니메이션 시작)
                        // 주의: 선이 먼저 나타났다 사라지지 않도록 active 클래스를 먼저 제거
                        
                        // 텍스트 색상을 회색으로 변경
                        const stepTitle = currentStep.querySelector('.step-title');
                        if (stepTitle) {
                            stepTitle.style.color = 'var(--text-color-3)';
                        }
                        
                        if (currentStepIndex < stepElements.length - 1) {
                            // 마지막 단계가 아닐 경우에만 선 애니메이션 표시
                            requestAnimationFrame(() => {
                                // 레이아웃 리플로우를 강제하고, 트랜지션이 시작되기 전에 completed 클래스 추가
                                void currentStep.offsetWidth;
                                currentStep.classList.add('completed');
                            });
                        } else {
                            // 마지막 단계는 선 없이 바로 completed 클래스만 추가
                            currentStep.classList.add('completed');
                        }
                        
                        // 모든 단계가 완료되었는지 확인하고 스피너를 체크 아이콘으로 변경
                        if (currentStepIndex === stepElements.length - 1) {
                            // 마지막 단계가 완료되면 스피너를 체크 아이콘으로 변경
                            setTimeout(() => {
                                const kaitoIntro = document.getElementById('kaito-intro');
                                if (kaitoIntro) {
                                    const introTextSpan = kaitoIntro.querySelector('span');
                                    if (introTextSpan) {
                                        // 스피너 요소 찾기
                                        const spinner = introTextSpan.querySelector('.loading-spinner');
                                        if (spinner) {
                                            // 스피너의 위치와 크기를 기억
                                            const spinnerRect = spinner.getBoundingClientRect();
                                            const spinnerWidth = spinnerRect.width;
                                            const spinnerHeight = spinnerRect.height;
                                            
                                            // 스피너를 감싸는 컨테이너 생성
                                            const iconContainer = document.createElement('div');
                                            iconContainer.className = 'icon-container';
                                            iconContainer.style.cssText = `
                                                display: inline-block;
                                                width: ${spinnerWidth}px;
                                                height: ${spinnerHeight}px;
                                                position: relative;
                                                margin-right: 8px;
                                                vertical-align: middle;
                                            `;
                                            
                                            // 체크 아이콘 생성
                                            const checkIcon = document.createElement('div');
                                            checkIcon.className = 'check-icon';
                                            checkIcon.innerHTML = `
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#5D5FEF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="6 12 10 16 18 8"></polyline>
                                                </svg>
                                            `;
                                            checkIcon.style.cssText = `
                                                position: absolute;
                                                left: 0;
                                                top: 0;
                                                width: 100%;
                                                height: 100%;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                opacity: 0;
                                                transition: opacity 0.3s ease;
                                            `;
                                            
                                            // 텍스트 저장
                                            const textContent = introTextSpan.textContent.replace(/^\s*[\S\s]*?최적의/, '최적의').trim();
                                            
                                            // 기존 스피너는 대체할 컨테이너에 추가
                                            spinner.style.transition = 'opacity 0.3s ease';
                                            spinner.style.opacity = '0';
                                            
                                            // 스피너를 컨테이너로 대체
                                            iconContainer.appendChild(spinner);
                                            iconContainer.appendChild(checkIcon);
                                            
                                            // 기존 내용 지우고 새 컨테이너와 텍스트 추가
                                            introTextSpan.innerHTML = '';
                                            introTextSpan.appendChild(iconContainer);
                                            introTextSpan.appendChild(document.createTextNode(' ' + textContent));
                                            
                                            // 애니메이션 타이밍에 맞춰 스피너를 숨기고 체크 아이콘 표시
                                            setTimeout(() => {
                                                checkIcon.style.opacity = '1';
                                            }, 300);
                                        } else {
                                            // 스피너가 없는 경우 새로 아이콘 생성
                                            const iconContainer = document.createElement('div');
                                            iconContainer.className = 'icon-container';
                                            iconContainer.style.cssText = `
                                                display: inline-block;
                                                width: 16px;
                                                height: 16px;
                                                position: relative;
                                                margin-right: 8px;
                                                vertical-align: middle;
                                            `;
                                            
                                            const checkIcon = document.createElement('div');
                                            checkIcon.className = 'check-icon';
                                            checkIcon.innerHTML = `
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#5D5FEF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="6 12 10 16 18 8"></polyline>
                                                </svg>
                                            `;
                                            checkIcon.style.cssText = `
                                                position: absolute;
                                                left: 0;
                                                top: 0;
                                                width: 100%;
                                                height: 100%;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            `;
                                            
                                            iconContainer.appendChild(checkIcon);
                                            
                                            // 기존 내용 지우고 새 컨테이너와 텍스트 추가
                                            introTextSpan.innerHTML = '';
                                            introTextSpan.appendChild(iconContainer);
                                            introTextSpan.appendChild(document.createTextNode(' 최적의 경로로 자동으로 구매해요'));
                                        }
                                    }
                                }
                            }, 500);
                            
                            // 최종 완료 처리
                            showFinalCompletion(cardElement, 500); // 500ms 지연 후 최종 완료 표시
                        } else {
                            // 5단계: 선 애니메이션 진행 후 다음 단계로 이동 (더 빠르게)
                            setTimeout(() => {
                                currentStepIndex++;
                                if (currentStepIndex < stepElements.length) {
                                    stepTimeoutId = setTimeout(focusNextStep, 150); // 200ms -> 150ms로 더 빠르게
                                }
                            }, 200); // 300ms -> 200ms로 더 빠르게
                        }
                    }, 150); // 200ms -> 150ms로 더 빠르게
                }, 150); // 200ms -> 150ms로 더 빠르게
            } else {
                console.log(`모든 단계 애니메이션 완료 감지: 카드 ${cardElement.id || '(ID 없음)'}`);
                return; // 모든 단계 완료
            }
        }

        // 첫 번째 단계 시작 전에 딜레이 추가 (더 빠르게)
        setTimeout(focusNextStep, 500); // 800ms -> 500ms로 더 빠르게
    }

    // Define checkAllStepsComplete (though not strictly needed if called from focusNextStep)
    function checkAllStepsComplete(cardElement) {
        if (!cardElement) return false;
        const steps = cardElement.querySelectorAll('.animated-route .route-step');
        if (steps.length === 0) return false;
        return Array.from(steps).every(step => step.classList.contains('completed'));
    }

    // Define showFinalCompletion function - Takes cardElement and optional delay
    function showFinalCompletion(cardElement, delay = 0) {
        // console.log("[showFinalCompletion] 호출됨. cardElement:", cardElement, "delay:", delay);
        if (!cardElement || !cardElement.id) {
            // console.error("[showFinalCompletion] 유효하지 않은 cardElement 또는 ID 없음:", cardElement);
            return;
        }

        const cardContainer = document.getElementById('card-container');
        if (!cardContainer) {
            // console.error("[showFinalCompletion] card-container 찾기 실패. cardElement:", cardElement);
            return;
        }

        // 카이토 설명 요소 가져오기
        const kaitoIntroElement = document.getElementById('kaito-intro');

        // 주문 완료 또는 결제 완료 요소를 document에서 찾음
        const orderCompleteElement = document.querySelector('.order-complete');
        const paymentCompleteElement = document.querySelector('.payment-complete');

        if (!orderCompleteElement || !paymentCompleteElement) {
            // console.error("[showFinalCompletion] 주문 완료 또는 결제 완료 요소를 찾을 수 없음 (document query).");
            return;
        }

        // cardElement의 dataset에서 필요한 정보 가져오기
        const selectedExchangePrice = parseInt(cardElement.dataset.price, 10) || 0;
        const currentCoinSymbol = cardElement.dataset.coinSymbol || 'BTC'; // 기본값 BTC 또는 현재 코인 심볼
        const currentCoinPrice = coinData[currentCoinSymbol] ? coinData[currentCoinSymbol].price : 0;
        const savingsAmount = currentCoinPrice - selectedExchangePrice;

        // 결제 완료 텍스트 설정
        const completeTextElement = paymentCompleteElement.querySelector('.complete-text');
        if (completeTextElement) {
            const amountText = formatAmount(selectedExchangePrice);
            completeTextElement.innerHTML = `${amountText}원에 결제 완료되었어요!`;
        }

        // 지정된 지연 후 애니메이션 시작
        setTimeout(() => {
            // 다른 카드 숨기기
            document.querySelectorAll('.card:not(.selected)').forEach(card => {
                card.classList.remove('visible');
                card.classList.add('hidden-above');
            });

            // 선택된 카드 중앙 정렬 및 크기 조절
            cardElement.style.transform = 'translateY(-50%) scale(1.05)';
            cardElement.style.top = '40%';
            cardElement.style.zIndex = '100';
            cardElement.classList.add('final-focus');

            // 주문 완료 요소 표시 (첫 번째 녹색 체크마크)
            orderCompleteElement.style.display = 'flex'; // flex로 변경
            orderCompleteElement.classList.remove('hidden');
            orderCompleteElement.classList.add('show');

            const checkMark = orderCompleteElement.querySelector('.final-checkmark');
            if (checkMark) {
                // 애니메이션 클래스 추가 전에 리셋 (재실행 위해)
                checkMark.classList.remove('animate');
                void checkMark.offsetWidth; // Reflow
                checkMark.classList.add('animate');

                // 첫 번째 체크마크 애니메이션 완료 리스너
                checkMark.addEventListener('animationend', function firstCheckAnimationEndHandler() {
                    checkMark.removeEventListener('animationend', firstCheckAnimationEndHandler);

                    // 주문 완료 숨기기
                    orderCompleteElement.classList.remove('show');
                    orderCompleteElement.classList.add('hidden');

                    // 결제 완료 표시 (두 번째 파란 체크마크)
                    paymentCompleteElement.style.display = 'flex'; // flex로 변경
                    paymentCompleteElement.classList.remove('hidden');
                    paymentCompleteElement.classList.add('show');

                    const blueCheckMark = paymentCompleteElement.querySelector('.final-checkmark.blue');
                    if (blueCheckMark) {
                        // 애니메이션 클래스 추가 전에 리셋
                        blueCheckMark.classList.remove('animate');
                        void blueCheckMark.offsetWidth; // Reflow
                        blueCheckMark.classList.add('animate');

                        // 두 번째(파란색) 체크마크 애니메이션 완료 리스너 *** 여기에 메시지 업데이트 로직 추가 ***
                        blueCheckMark.addEventListener('animationend', function blueCheckAnimationEndHandler() {
                            blueCheckMark.removeEventListener('animationend', blueCheckAnimationEndHandler);

                            // 카이토 설명 영역 업데이트
                            if (kaitoIntroElement) {
                                // 페이드 아웃 후 텍스트 변경 및 페이드 인
                                kaitoIntroElement.style.transition = 'opacity 0.3s ease-out';
                                kaitoIntroElement.style.opacity = '0';
                                
                                setTimeout(() => {
                                    kaitoIntroElement.classList.add('completed'); // 완료 스타일 적용
                                    const introSpan = kaitoIntroElement.querySelector('span');
                                    
                                    // 해당 거래소의 절약 금액 직접 가져오기
                                    const exchangeName = cardElement.dataset.exchangeName;
                                    const exchange = coinData[currentCoin].exchanges.find(ex => ex.name === exchangeName);
                                    
                                    if (introSpan) {
                                        // 조건 체크 없이 항상 최대 금액 표시
                                        const savedAmount = exchange ? exchange.savingsAmount : savingsAmount;
                                        introSpan.textContent = `최대 ${formatAmount(savedAmount)}원 아꼈어요!`;
                                        console.log(`[수정됨] kaito-intro 업데이트: 최대 ${formatAmount(savedAmount)}원 아꼈어요!`);
                                    }
                                    
                                    // 페이드 인
                                    kaitoIntroElement.style.transition = 'opacity 0.4s ease-in';
                                    kaitoIntroElement.style.opacity = '1';
                                }, 300);
                            } else {
                                 console.error('kaitoIntroElement를 찾을 수 없습니다.');
                            }

                            // 여기서 최종 상태 처리, 다음 화면 전환 등 추가 로직 구현 가능
                            // 예: 3초 후 다음 화면으로 이동
                            // setTimeout(() => {
                            //     goToScreen(2); // 다음 화면으로 이동 (가정)
                            // }, 3000);
                        });
                    } else {
                        console.error('blueCheckMark 요소를 찾을 수 없습니다.');
                    }
                });
            } else {
                console.error('checkMark 요소를 찾을 수 없습니다.');
            }
        }, delay);
    }

    function selectCheapestCard() {
        stopUpdates(); // Stop any further updates or countdowns
        console.log("Selecting the cheapest card...");

        // Ensure cardElements are up-to-date or find them again
        const currentCards = cardContainer.querySelectorAll('.card.visible');
        if (currentCards.length === 0) {
            console.log("No visible cards to select from.");
            return;
        }

        let cheapestCard = null;
        let lowestPrice = Infinity;

        currentCards.forEach(card => {
            // data-price 속성으로 가격 비교
            const priceValue = parseInt(card.dataset.price, 10);

            if (!isNaN(priceValue) && priceValue < lowestPrice) {
                lowestPrice = priceValue;
                cheapestCard = card;
            }
        });

        if (cheapestCard) {
            console.log(`Cheapest card identified: ${cheapestCard.id} with price ${lowestPrice}`);

            // 1단계: 선택된 카드에 부드러운 트랜지션 추가
            cheapestCard.style.transition = "transform 1.5s cubic-bezier(0.1, 0.7, 0.1, 1), opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1), height 2s cubic-bezier(0.19, 1, 0.22, 1)";
            
            // 2단계: 다른 카드들도 페이드아웃할 준비
            currentCards.forEach(card => {
                if (card !== cheapestCard) {
                    card.style.transition = "transform 1.5s cubic-bezier(0.1, 0.7, 0.1, 1), opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)";
                }
            });
            
            // 3단계: 카드 선택 및 동시에 텍스트 변경 시작
            // Add 'selected' class to the chosen card and 'deselected' to others
            currentCards.forEach(card => {
                if (card === cheapestCard) {
                    card.classList.add('selected');
                    card.classList.remove('deselected');
                    
                    // 선택된 카드의 높이 설정을 점진적으로 변경
                    setTimeout(() => {
                        card.style.height = '434px'; // 높이 증가
                    }, 100);
                    
                    // 선택된 카드에서 amount-saved만 숨기고 레이아웃은 그대로 유지
                    const amountSavedElement = card.querySelector('.amount-saved');
                    if (amountSavedElement) {
                        // 먼저 데이터와 일치하도록 업데이트 후 숨김 처리
                        const currentExchange = coinData[currentCoin].exchanges.find(ex => ex.name === card.dataset.exchangeName);
                        if (currentExchange) {
                            const amountValueElement = amountSavedElement.querySelector('.amount-value');
                            if (amountValueElement) {
                                amountValueElement.textContent = formatAmount(currentExchange.savingsAmount);
                            }
                        }
                        
                        // 업데이트 후 숨김 처리
                        amountSavedElement.style.transition = 'opacity 0.7s ease';
                        amountSavedElement.style.opacity = '0';
                        setTimeout(() => {
                            amountSavedElement.style.visibility = 'hidden';
                        }, 700);
                    }
                } else {
                    card.classList.add('deselected');
                    card.classList.remove('selected');
                    
                    // 다른 카드들은 아이콘 표시 리셋
                    const staticIcons = card.querySelector('.static-route-icons');
                    const animatedRoute = card.querySelector('.animated-route');
                    if (staticIcons) staticIcons.style.display = 'flex';
                    if (animatedRoute) animatedRoute.innerHTML = '';
                }
            });

            // 4단계: 동시에 텍스트 변경 및 카드 애니메이션 시작
            // Modify #kaito-intro content and prepare route animation
            const kaitoIntro = document.getElementById('kaito-intro');
            
            // 경로 섹션 요소 미리 준비
            const routeSection = cheapestCard.querySelector('.route-section');
            if (routeSection) {
                routeSection.style.display = 'block';
                routeSection.style.opacity = '0';
                routeSection.style.transition = 'opacity 0.8s ease';
            }
            
            // 카이토 인트로와 경로 섹션을 함께 페이드인
            if (kaitoIntro) {
                kaitoIntro.style.transition = 'opacity 0.3s ease-out';
                kaitoIntro.style.opacity = '0';
                
                // 텍스트 변경 및 페이드인 시작 (더 빠르게)
                setTimeout(() => {
                    const iconWrapper = kaitoIntro.querySelector('.kaito-icon-wrapper');
                    const introTextSpan = kaitoIntro.querySelector('span');
                    
                    if (iconWrapper) iconWrapper.style.display = 'none';
                    
                    // 로딩 스피너 생성 및 추가
                    const spinner = document.createElement('div');
                    spinner.className = 'loading-spinner';
                    spinner.style.cssText = `
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        border: 2px solid transparent;
                        border-top-color: #5D5FEF; /* 프라이머리 컬러 */
                        border-radius: 50%;
                        margin-right: 8px;
                        vertical-align: middle;
                        animation: spin 1s linear infinite;
                    `;
                    
                    // 스피너 애니메이션 스타일 추가
                    if (!document.querySelector('style#spinner-style')) {
                        const spinnerStyle = document.createElement('style');
                        spinnerStyle.id = 'spinner-style';
                        spinnerStyle.textContent = `
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `;
                        document.head.appendChild(spinnerStyle);
                    }
                    
                    if (introTextSpan) {
                        introTextSpan.innerHTML = '';
                        introTextSpan.appendChild(spinner);
                        introTextSpan.appendChild(document.createTextNode(' 최적의 경로로 자동으로 구매해요'));
                    }
                    
                    // 텍스트와 경로 섹션 동시에 페이드인 시작
                    kaitoIntro.style.transition = 'opacity 0.3s ease-in';
                    kaitoIntro.style.opacity = '1';
                    
                    // 경로 섹션도 동시에 페이드인
                    if (routeSection) {
                        routeSection.style.opacity = '1';
                        
                        // 경로 애니메이션 시작 - 약간의 지연 추가 (카드 펼침이 약간 진행된 후)
                        setTimeout(() => {
                            const stopAnimation = animateRoute(cheapestCard);
                            cheapestCard.dataset.stopAnimation = stopAnimation;
                        }, 150); // 200ms -> 150ms로 더 빠르게
                    }
                }, 150); // 200ms -> 150ms로 더 빠르게
            }

            // 5단계: 카드 선택 모드로 화면 전환
            const screen1 = document.getElementById('screen1');
            if (screen1) {
                screen1.classList.add('card-selected-mode');
            }
        } else {
            console.log("Could not determine the cheapest card.");
        }
    }

    function updateCards(coinSymbol) {
         console.log(`Updating cards for ${coinSymbol}`);
         const data = coinData[coinSymbol];
         if (!data) {
             console.error(`No data found for coin symbol: ${coinSymbol}`);
             return;
         }

         // --- Restore #kaito-intro content --- 
         const kaitoIntro = document.getElementById('kaito-intro');
         if (kaitoIntro) {
             const iconWrapper = kaitoIntro.querySelector('.kaito-icon-wrapper');
             const introTextSpan = kaitoIntro.querySelector('span');

             kaitoIntro.classList.remove('hidden'); // Make intro visible if hidden by click
             kaitoIntro.style.opacity = '1'; // Ensure visible
             
             if(iconWrapper) {
                 iconWrapper.style.display = 'flex'; // Restore icon display
             }
             if(introTextSpan) {
                 introTextSpan.textContent = '카이토 구매를 위한 최적의 경로에요'; // Restore original text
             }
         }
         // --- End of #kaito-intro restoration ---
         
         // 트랜지션 시간 및 효과를 위한 스타일 추가
         const styleElement = document.createElement('style');
         styleElement.textContent = `
            .card {
                transition: opacity 0.8s ease,
                            transform 0.6s ease-out,
                            top 0.8s cubic-bezier(0.33, 1, 0.68, 1);
                will-change: top;
                width: calc(100% - 32px) !important;
                margin-left: 16px !important;
                margin-right: 16px !important;
            }
            .card.reorder-shadow {
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                z-index: 10;
            }
         `;
         document.head.appendChild(styleElement);

         // 3. 금액 낮은 순으로 정렬 (price 기준으로 오름차순 정렬)
         const sortedExchanges = [...data.exchanges].sort((a, b) => a.price - b.price);
         
         // card-selected-mode 클래스 제거
         const screen1 = document.getElementById('screen1');
         if (screen1) screen1.classList.remove('card-selected-mode');

         const existingCards = cardContainer.querySelectorAll('.card');
         
         // 카드가 없는 경우 처음부터 생성
         if (existingCards.length === 0) {
             // 새 카드 생성 및 추가
             sortedExchanges.forEach((exchange, index) => {
                 const cardId = `card${index + 1}`;
                 const cardElement = createCardElement(exchange, cardId, coinSymbol);
                 cardContainer.appendChild(cardElement);
                 cardElements.push(cardElement);

                 // 클릭 이벤트 리스너 추가
                 cardElement.addEventListener('click', () => {
                     selectCard(cardElement);
                 });

                 // 카드 표시
                 setTimeout(() => {
                     cardElement.classList.remove('hidden-above', 'hidden-below');
                     cardElement.classList.add('visible');
                     const amountElement = cardElement.querySelector('.amount-saved .amount-value');
                     if (amountElement) {
                         // 애니메이션 속도 빠르게 조정 (2500ms -> 1000ms)
                         animateCountUp(amountElement, exchange.savingsAmount, 1000);
                     }
                     
                     // 가격 애니메이션 제거 - 초기 생성 시에는 애니메이션 적용하지 않음
                 }, 50);
                 
                 // 카드 초기 위치 설정 (가격 변동 후 위치와 동일하게 설정)
                 const newTop = index === 0 ? 0 : 
                             index === 1 ? (176 + 16) : 
                             index === 2 ? (176 + 16 + 120 + 16) : 
                             (176 + 16 + (120 + 16) * 2);
                 
                 // 위치 및 높이 설정
                 cardElement.style.position = 'absolute';
                 cardElement.style.top = `${newTop}px`;
                 
                 // 높이 설정 (첫 번째 카드는 큰 사이즈, 나머지는 작은 사이즈)
                 if (index === 0) {
                     cardElement.style.height = '176px';
                 } else {
                     cardElement.style.height = '120px';
                 }
             });
             
             // 스타일 요소는 계속 유지 (제거하지 않음)
             return;
         }
         
         // 기존 카드가 있는 경우 재정렬 애니메이션 실행
         
         // 1. 현재 카드 정보 저장
         const cardInfo = Array.from(existingCards).map(card => {
             // 현재 가격 정보도 저장
             const priceInfo = card.querySelector('.price-info');
             const currentPrice = priceInfo ? parseInt(priceInfo.textContent.replace(/[^0-9]/g, ''), 10) : 0;
             
             return {
                 element: card,
                 exchangeName: card.dataset.exchangeName,
                 currentTop: card.offsetTop,
                 currentPosition: parseInt(card.style.top || '0', 10),
                 price: parseFloat(card.dataset.price || '0'),
                 displayPrice: currentPrice // 현재 표시된 가격 저장
             };
         });
         
         // 2. 각 카드 요소의 내용을 업데이트하고 재정렬 위치 계산
         sortedExchanges.forEach((exchange, index) => {
             // 해당 거래소 이름을 가진 카드 찾기
             const cardMatch = cardInfo.find(c => c.exchangeName === exchange.name);
             
             if (cardMatch) {
                 const card = cardMatch.element;
                 
                 // 카드 데이터 업데이트
                 card.dataset.price = exchange.price;
                 
                 // 가격 정보 업데이트 - 애니메이션 추가
                 const priceInfo = card.querySelector('.price-info');
                 if (priceInfo) {
                     // 이전 가격에서 새 가격으로 애니메이션
                     const oldPrice = cardMatch.displayPrice;
                     const newPrice = exchange.price;
                     
                     console.log(`카드 ${card.id} 가격 변경: ${formatAmount(oldPrice)} -> ${formatAmount(newPrice)}`);
                     
                     // 가격이 변경된 경우에만 애니메이션 적용
                     if (oldPrice !== newPrice) {
                         animateCountUp(priceInfo, newPrice, 1000);
                     } else {
                         // 변경이 없으면 그냥 텍스트 설정
                         priceInfo.textContent = `${formatAmount(newPrice)}원`;
                     }
                 }
                 
                 // 아낀 금액 업데이트 - 가격 변동과 동일한 애니메이션 적용
                 const amountSavedElement = card.querySelector('.amount-saved');
                 if (amountSavedElement) {
                     // amount-saved 요소가 숨겨진 경우 다시 표시
                     if (amountSavedElement.style.visibility === 'hidden') {
                         amountSavedElement.style.visibility = 'visible';
                         amountSavedElement.style.opacity = '1';
                     }
                     
                     const amountElement = amountSavedElement.querySelector('.amount-value');
                     if (amountElement) {
                         // 현재 표시되는 금액 확인
                         const currentSavingsText = amountElement.textContent;
                         const currentSavings = parseInt(currentSavingsText.replace(/[^0-9]/g, ''), 10) || 0;
                         const newSavings = exchange.savingsAmount;
                         
                         console.log(`카드 ${card.id} 절약 금액 변경: ${formatAmount(currentSavings)} -> ${formatAmount(newSavings)}`);
                         
                         // 금액이 변경된 경우에만 애니메이션 적용 (0인 경우에도 애니메이션)
                         if (currentSavings !== newSavings) {
                             // 가격 애니메이션과 동일한 속도 적용
                             animateCountUp(amountElement, newSavings, 1000);
                         } else {
                             // 변경이 없으면 그냥 텍스트 설정
                             amountElement.textContent = formatAmount(newSavings);
                         }
                     }
                 }
                 
                 // 재정렬 위치 계산 (첫번째 카드는 0, 나머지는 간격을 둠)
                 const newTop = index === 0 ? 0 : 
                               index === 1 ? (176 + 16) : 
                               index === 2 ? (176 + 16 + 120 + 16) : 
                               (176 + 16 + (120 + 16) * 2);
                 
                 // 움직일 거리만 확인하여 애니메이션 효과 추가
                 if (cardMatch.currentTop !== newTop) {
                     console.log(`카드 ${card.id} 위치 변경: top ${cardMatch.currentTop}px -> ${newTop}px`);
                     
                     // 현재 위치를 절대 위치로 설정하여 트랜지션 시작점 설정
                     card.style.position = 'absolute';
                     card.style.top = `${cardMatch.currentTop}px`;
                     
                     // 높이만 설정하고 너비는 CSS로 제어
                     if (index === 0) {
                         card.style.height = '176px';
                     } else {
                         card.style.height = '120px';
                     }
                     
                     // 너비와 마진을 CSS에서 !important로 설정하므로 여기서는 설정하지 않음
                     card.style.zIndex = '5';
                     
                     // 올라가는 카드는 더 높은 z-index를 가지도록 설정
                     const isMovingUp = cardMatch.currentTop > newTop;
                     if (isMovingUp) {
                         card.style.zIndex = '10';
                     }
                     
                     // 카드 이동 애니메이션 설정 (약간의 지연 추가)
                     setTimeout(() => {
                         // top만 트랜지션하고 다른 속성은 트랜지션하지 않음
                         card.style.transition = `top ${isMovingUp ? '0.7s' : '0.9s'} cubic-bezier(0.33, 1, 0.68, 1)`;
                         
                         // 새 위치로 이동
                         card.style.top = `${newTop}px`;
                         
                         // 애니메이션 완료 후 상태 정리
                         setTimeout(() => {
                             // 높이와 z-index를 제외한 시각적 효과 원상복구
                             card.style.zIndex = '';
                             card.style.position = '';
                             card.style.transition = '';
                         }, isMovingUp ? 800 : 1000);
                     }, 50 + (isMovingUp ? 0 : 150));
                 }
             }
         });
         
         // 스타일 요소는 계속 유지 - 제거하지 않음
     }

    function changeCoinAndUpdate() {
        console.log("Changing coin...");
        
        // 타이틀 먼저 페이드 아웃
        const mainCoinTitle = document.getElementById('main-coin-title');
        if (mainCoinTitle) {
            mainCoinTitle.style.transition = 'opacity 0.5s ease, transform 0.3s ease';
            mainCoinTitle.style.opacity = '0';
            mainCoinTitle.style.transform = 'translateY(-10px)';
        }
        
        // 약간의 지연 후 코인 변경 및 UI 업데이트
        setTimeout(() => {
            currentCoin = 'BNB'; // Switch to BNB
            updateCards(currentCoin);
            
            // 타이틀 페이드 인
            setTimeout(() => {
                if (mainCoinTitle) {
                    mainCoinTitle.style.transform = 'translateY(0)';
                    mainCoinTitle.style.opacity = '1';
                }
            }, 300);

            // After updating cards for BNB, wait 4 seconds (5s total - 1s left) then select the cheapest
            if (selectCardTimeoutId) clearTimeout(selectCardTimeoutId);
            selectCardTimeoutId = setTimeout(() => {
                selectCheapestCard();
            }, 4500); // 4.5초 후 가장 싼 카드 선택 (카드 모두 표시 후 1.5초 더 대기)

            // Restart the 5-second countdown for the new coin (BNB)
            countdown = 5; // Reset countdown to 5 seconds
            startCountdown(); // Start the countdown for BNB
        }, 500);
    }

    function startUpdates() {
        stopUpdates(); // Clear any existing timeouts/intervals

        console.log("Starting initial update cycle (BNB)");
        currentCoin = 'BNB'; // 시작부터 BNB로 설정
        updateCards(currentCoin); // BNB로 업데이트

        // 가격 변동 효과 추가: 3.5초 후에 가격을 변경하고 카드를 다시 정렬
        setTimeout(() => {
            const currentExchanges = coinData[currentCoin].exchanges;
            const basePrice = coinData[currentCoin].price; // 기준 가격

            // 1. Bybit과 나머지 거래소 분리
            const bybitExchange = currentExchanges.find(ex => ex.name === 'Bybit');
            const otherExchanges = currentExchanges.filter(ex => ex.name !== 'Bybit');

            if (!bybitExchange) {
                console.error("Bybit exchange not found in data!");
                return; // Bybit 데이터 없으면 중단
            }

            // 2. 나머지 거래소들 정렬 (현재 가격 기준)
            const sortedOthers = [...otherExchanges].sort((a, b) => a.price - b.price);

            // 3. 나머지 거래소들의 목표 순서 생성 (현재 순서 뒤집기)
            const targetOrderNamesOthers = sortedOthers.map(ex => ex.name).reverse();

            // 4. 나머지 거래소들의 새 가격 할당 기준값 계산
            const avgPriceOthers = otherExchanges.reduce((sum, ex) => sum + ex.price, 0) / otherExchanges.length;
            const priceStepOthers = Math.max(1000, Math.floor(avgPriceOthers * 0.01));

            console.log(`나머지 가격 재설정: 평균가=${formatAmount(avgPriceOthers)}, 간격=${formatAmount(priceStepOthers)}`);

            let minOtherPrice = Infinity; // 나머지 중 가장 낮은 가격 추적

            // 5. 나머지 거래소들에 목표 순서대로 새 가격 할당
            targetOrderNamesOthers.forEach((exchangeName, index) => {
                const exchangeToUpdate = otherExchanges.find(ex => ex.name === exchangeName);
                if (exchangeToUpdate) {
                    // 새 가격 계산 (나머지 거래소 내에서 순서 변경)
                    const newPrice = Math.floor(avgPriceOthers + (index - Math.floor(targetOrderNamesOthers.length / 2)) * priceStepOthers);
                    
                    console.log(` - ${exchangeName}: ${formatAmount(exchangeToUpdate.price)} -> ${formatAmount(newPrice)} (새 순위: ${index + 1})`);
                    exchangeToUpdate.price = newPrice;
                    
                    // 저장 금액도 함께 업데이트 (0 이하가 되지 않도록)
                    // 실제 가격 차이의 약 40% 수준으로 절약 금액 계산 (더 현실적인 금액)
                    const realSavings = Math.max(0, basePrice - newPrice);
                    
                    // 같은 거래소라도 동적인 절약 금액 표시를 위해 변동폭 추가 (±20% 범위)
                    // 원래 절약 금액의 80%~120% 범위 내에서 약간의 변동을 줌
                    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8~1.2 사이의 랜덤 값
                    exchangeToUpdate.savingsAmount = Math.floor(realSavings * 0.4 * randomFactor);
                    
                    console.log(` - ${exchangeName} 절약 금액: ${formatAmount(exchangeToUpdate.savingsAmount)}원 (실제 차액의 40% × ${randomFactor.toFixed(2)})`);

                    if (newPrice < minOtherPrice) {
                        minOtherPrice = newPrice;
                    }
                }
            });

            // 6. Bybit 가격 설정 (나머지 최저가보다 항상 낮게)
            // 나머지 최저가보다 가격 간격의 2배만큼 낮게 설정
            const bybitNewPrice = minOtherPrice - (priceStepOthers * 2);
            console.log(` - Bybit: ${formatAmount(bybitExchange.price)} -> ${formatAmount(bybitNewPrice)} (Guaranteed Lowest)`);
            bybitExchange.price = bybitNewPrice;
            
            // 바이빗의 저장 금액 계산 (가격 변동 후)
            // 기본 절약 금액 계산 - 다른 거래소와 동일하게 실제 가격 차이의 40% 수준으로 계산
            const baseSavings = Math.max(0, basePrice - bybitNewPrice);
            
            // 변동된 가격에 따라 절약 금액도 살짝 증가 (기존 25,000보다 약간 높게)
            const minSavingsAfterChange = 27000; // 변동 후 최소 보장 금액 수정 (25,000 -> 27,000)
            
            // 약간의 변동성 추가
            const bybitRandomFactor = 0.95 + (Math.random() * 0.1); // 0.95~1.05 사이의 랜덤 값
            const realSavings = Math.floor(baseSavings * 0.4 * bybitRandomFactor);
            
            // 최소 보장 금액과 실제 계산 금액 중 큰 값 사용
            bybitExchange.savingsAmount = Math.max(minSavingsAfterChange, realSavings);
            
            console.log(` - Bybit 절약 금액: ${formatAmount(bybitExchange.savingsAmount)}원 (기본: ${formatAmount(realSavings)}원, 최소 보장: ${formatAmount(minSavingsAfterChange)}원)`);

            // 다른 거래소들의 최대 절약 금액도 확인하여 바이빗이 항상 더 많은 혜택을 보이도록 조정
            const maxOtherSavings = Math.max(...otherExchanges.map(ex => ex.savingsAmount || 0));
            if (maxOtherSavings >= bybitExchange.savingsAmount) {
                // 다른 거래소 중 최대 절약 금액보다 10% 더 많게 설정
                bybitExchange.savingsAmount = Math.floor(maxOtherSavings * 1.1);
                console.log(` - Bybit 절약 금액 조정: ${formatAmount(bybitExchange.savingsAmount)}원 (다른 거래소 최대값 ${formatAmount(maxOtherSavings)}원보다 10% 증가)`);
            }

            // 가격 변동 후 카드 업데이트 전에 더 긴 딜레이 추가 (2초 더 기다림)
            setTimeout(() => {
                updateCards(currentCoin);
                
                // 가격 변동된 카드가 표시된 후 1.5초 지연 후 자동 선택 시작
                if (selectCardTimeoutId) clearTimeout(selectCardTimeoutId);
                selectCardTimeoutId = setTimeout(() => {
                    selectCheapestCard();
                }, 4000); // 가격 변동 후 4초 지연 (1.5초에서 4초로 증가)
            }, 4000); // 가격 재할당 후 업데이트까지 4초 대기
        }, 0); // 초기 로딩 후 바로 가격 변경 시작 (1초에서 0초로 변경)

        // 카운트다운 텍스트 숨기기
        if (countdownTextElement) {
            countdownTextElement.style.display = 'none';
        }
    }

    function stopUpdates() {
        if (updateTimeoutId) clearTimeout(updateTimeoutId);
        if (selectCardTimeoutId) clearTimeout(selectCardTimeoutId);
        updateTimeoutId = null;
        selectCardTimeoutId = null;
        console.log("Updates stopped.");

         // Stop any ongoing route animations on existing cards
         cardContainer.querySelectorAll('.card').forEach(card => {
             const stopFunc = card.dataset.stopAnimation;
             if (typeof stopFunc === 'function') {
                 stopFunc();
                 delete card.dataset.stopAnimation;
             }
             // Reset visual state if needed (e.g., show static icons)
             const staticIcons = card.querySelector('.static-route-icons');
             const animatedRoute = card.querySelector('.animated-route');
             if (staticIcons) staticIcons.style.display = 'flex';
             if (animatedRoute) animatedRoute.innerHTML = '';
         });

         // Remove card-selected-mode class when stopping updates
         const screen1 = document.getElementById('screen1');
         if (screen1) screen1.classList.remove('card-selected-mode');
    }

    function initializeScreen1() {
        console.log("Initializing Screen 1");
        startUpdates(); // Start the BTC -> Countdown -> BNB -> Select sequence
    }

    // --- Screen 2 Initialization ---
    function initializeScreen2() {
        // Trigger graph animation restart using class toggle
        if (graphLine) {
            // Remove the class to reset animation state
            graphLine.classList.remove('animate');
            // Force reflow/repaint 
            void graphLine.offsetWidth;
            // Add the class back to restart the animation
            graphLine.classList.add('animate');
        }

        // Animate percentage value
        if (percentageValueElement) {
            // Reset text content to 0 before animating again
            percentageValueElement.textContent = '0';
            animateCountUp(percentageValueElement, 437, 2000, true);
        }
    }

    // --- Screen 3 Initialization ---
    function initializeScreen3() {
        if (screen3AmountValues) {
            screen3AmountValues.forEach(el => {
                const targetValue = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(targetValue)) {
                    el.textContent = '0'; // Reset before animating
                    animateCountUp(el, targetValue, 1500); // Animate amounts
                }
            });
        }
    }

    // --- Slider Logic (Updated for 3 screens) ---
    function goToScreen(screenIndex) {
        if (!sliderWrapper || screenIndex < 0 || screenIndex > 2) return;

        // 3번째 화면(주문 완료)이 없어지고 2단계까지만 표시하도록 수정
        const percentages = screenIndex === 2 ? ['0%', '-50%'] : ['0%', '-50%'];
        sliderWrapper.style.transform = `translateX(${percentages[Math.min(screenIndex, 1)]})`;
        currentScreen = Math.min(screenIndex, 1); // 최대 1까지만 허용 (2단계)

        // Initialize animations based on the target screen
        if (screenIndex === 1) {
             setTimeout(initializeScreen2, 100);
        }
        // Screen 2(index 2)로의 이동은 더이상 허용하지 않음
        // 스크린 1로 돌아가는 경우
        else if (screenIndex === 0 && cardContainer && countdownTextElement) {
            // Optionally restart screen 1 animations/timers if stopped
             startUpdates();
        }

        // Stop timers/animations of inactive screens
        if (screenIndex !== 0) {
            stopUpdates(); // Stop screen 1 timers
        }
    }

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 타이머 정리
            if (selectCardTimeoutId) clearTimeout(selectCardTimeoutId);
            selectCardTimeoutId = null;
        } else {
            if (currentScreen === 0 && cardContainer) {
                  console.log("Restarting screen 1 updates on visibility change (Restored)");
                  startUpdates(); // Simply restart updates
            } else if (currentScreen === 1) {
                 initializeScreen2();
            } else if (currentScreen === 2) {
                 initializeScreen3();
            }
        }
    });

    // Initial Setup
    if (cardContainer) {
        startUpdates(); // 간소화된 초기화 과정 시작
    } else {
        // Logic for initializing if starting on screen 2 or 3
        if (currentScreen === 1) initializeScreen2();
        else if (currentScreen === 2) initializeScreen3();
    }

    // Button Navigation Logic (Updated for 2 screens)
    const screen1Button = document.querySelector('#screen1 .btn.primary');
    const screen2Button = document.querySelector('#screen2 .btn.primary');
    const screen3Button = document.querySelector('#screen3 .btn.primary'); // Button on screen 3

    if (screen1Button) {
        screen1Button.addEventListener('click', () => goToScreen(1));
    }
    if (screen2Button) {
        screen2Button.addEventListener('click', () => goToScreen(0)); // 2번 화면에서 1번 화면으로 돌아감
    }
    if (screen3Button) {
        screen3Button.addEventListener('click', () => goToScreen(0)); // 3번 화면에서도 1번 화면으로 돌아감
    }

    // 카드 선택 및 관련 UI 업데이트를 처리하는 함수 추출
    function selectCard(cardElement) {
        if (!cardElement || cardElement.classList.contains('selected')) return;
        
        // Kaito 인트로 숨기기
        const kaitoIntro = document.getElementById('kaito-intro');
        if (kaitoIntro) {
            kaitoIntro.classList.add('hidden');
        }
        
        // 카드 선택 상태 업데이트
        const allCards = cardContainer.querySelectorAll('.card');
        allCards.forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');
        
        // 화면 모드 변경
        const screen1 = document.getElementById('screen1');
        if (screen1) {
            screen1.classList.add('card-selected-mode');
        }
        
        // 다른 카드 숨기기
        allCards.forEach(otherCard => {
            if (otherCard !== cardElement) {
                otherCard.classList.add('deselected');
                otherCard.classList.remove('visible');
            }
        });
        
        // 경로 애니메이션 시작
        setTimeout(() => {
            animateRoute(cardElement);
        }, 500);
    }

    // Add click event listener to each card - 마우스 클릭으로 카드 선택하는 기능 제거
    // cardContainer.querySelectorAll('.card').forEach(card => {
    //     card.addEventListener('click', () => {
    //         selectCard(card);
    //     });
    // });

    // 마지막 단계 처리를 위한 함수 추출
    function handleFinalStep() {
        // 카이토 인트로 텍스트 변경
        const kaitoIntro = document.getElementById('kaito-intro');
        if (kaitoIntro) {
            const introTextSpan = kaitoIntro.querySelector('span');
            if (introTextSpan) {
                // 텍스트 변경 (최적의 경로로 자동 구매중 -> 주문 완료!)
                kaitoIntro.style.transition = 'opacity 0.3s ease-out'; // 0.2s에서 원래값 0.3s로 복원
                kaitoIntro.style.opacity = '0';
                
                setTimeout(() => {
                    // 최신 절약 금액 가져오기 (데이터에서 직접 가져옴)
                    const exchangeName = cardElement.dataset.exchangeName;
                    const exchange = coinData[currentCoin].exchanges.find(ex => ex.name === exchangeName);
                    const savedAmount = exchange ? exchange.savingsAmount : 
                                     parseInt(cardElement.querySelector('.amount-value')?.textContent.replace(/[^0-9]/g, '') || '0', 10);
                    
                    // 항상 아낀 금액 표시
                    introTextSpan.textContent = `최대 ${formatAmount(savedAmount)}원 아꼈어요!`;
                    kaitoIntro.style.transition = 'opacity 0.3s ease-in'; // 0.2s에서 원래값 0.3s로 복원
                    kaitoIntro.style.opacity = '1';
                    
                    console.log(`[handleFinalStep 수정] kaito-intro 업데이트: 최대 ${formatAmount(savedAmount)}원 아꼈어요!`);
                }, 300); // 200ms에서 원래값 300ms로 복원
            }
        }
    }

    // 사전예약 버튼 클릭 이벤트 추가
    const preSignupBtn = document.querySelector('.pre-signup-btn');
    console.log('사전예약 버튼 요소:', preSignupBtn); // 디버깅을 위한 로그 추가
    
    if (preSignupBtn) {
        preSignupBtn.addEventListener('click', function() {
            console.log('사전예약 버튼 클릭됨!'); // 클릭 이벤트가 발생했는지 확인하는 로그
            
            // 간단한 모달 창 생성
            const modal = document.createElement('div');
            modal.className = 'signup-modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>`;
            closeBtn.onclick = function() {
                document.body.removeChild(modal);
            };
            
            const title = document.createElement('h3');
            title.textContent = '출시되면 알려드릴게요!';
            
            const inputEmail = document.createElement('input');
            inputEmail.type = 'text';
            inputEmail.placeholder = '이메일을 입력해주세요';
            
            const submitBtn = document.createElement('button');
            submitBtn.textContent = '알림 받기';
            submitBtn.onclick = function() {
                if (inputEmail.value.trim() === '') {
                    alert('이메일을 입력해주세요!');
                    return;
                }
                
                // 폼 제출 시 감사 메시지 표시
                modalContent.innerHTML = '';
                
                const thankTitle = document.createElement('h3');
                thankTitle.textContent = '사전예약이 완료되었어요!';
                
                const thankMessage = document.createElement('p');
                thankMessage.textContent = 'ZKAP이 출시되면 가장 먼저 알려드릴게요.';
                
                const closeThankBtn = document.createElement('button');
                closeThankBtn.textContent = '확인';
                closeThankBtn.onclick = function() {
                    document.body.removeChild(modal);
                };
                
                modalContent.appendChild(thankTitle);
                modalContent.appendChild(thankMessage);
                modalContent.appendChild(closeThankBtn);
                
                console.log('사전예약 신청:', inputEmail.value);
            };
            
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(title);
            modalContent.appendChild(inputEmail);
            modalContent.appendChild(submitBtn);
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        });
    }

    function markStepComplete(stepElement) {
        if (stepElement) {
            stepElement.classList.add('completed');
            
            // 주문 완료 시 텍스트 변경
            if (stepElement.classList.contains('step1-intro')) {
                const textSpan = stepElement.querySelector('span');
                if (textSpan) {
                    textSpan.textContent = "주문이 완료됐어요";
                }
            }
        }
    }

    // DOM 요소 선택 등 기존 초기화 코드
    const kaitoIntro = document.getElementById('kaito-intro');
    const statusSpan = kaitoIntro ? kaitoIntro.querySelector('span') : null; // null 체크 추가
    const targetText = "최적의 경로로 자동 구매 진행 중";

    // --- 스피너 가시성 관리 로직 --- START ---
    if (kaitoIntro && statusSpan) { // 요소가 존재하는지 확인
        // 스피너 표시 여부를 텍스트 내용에 따라 업데이트하는 함수
        const updateSpinnerVisibility = () => {
            // 앞뒤 공백 제거 후 텍스트 비교
            if (statusSpan.textContent.trim() === targetText) {
                kaitoIntro.classList.add('loading');
            } else {
                kaitoIntro.classList.remove('loading');
            }
        };

        // 페이지 로드 시 초기 텍스트 상태 확인
        updateSpinnerVisibility(); 

        // MutationObserver를 사용하여 span 내부 텍스트 변화 감지
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                // 텍스트 내용 변경 감지 (characterData 또는 childList)
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    updateSpinnerVisibility();
                    break; // 관련된 변경이 감지되면 루프 종료
                }
            }
        });

        // Observer 설정: span 요소 내부의 텍스트 변경 및 자식 노드 변경 감지
        const config = { characterData: true, childList: true, subtree: true };

        // span 요소 관찰 시작
        observer.observe(statusSpan, config);
    } else {
        console.error("스피너 제어를 위한 필수 요소(#kaito-intro 또는 내부 span)를 찾을 수 없습니다.");
    }
    // --- 스피너 가시성 관리 로직 --- END ---
});
