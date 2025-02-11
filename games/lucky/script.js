document.addEventListener('DOMContentLoaded', function() {
    var ws = new WebSocket('wss://flyluckyjet.pro:2346');
    let isRunning = false;
    let clientServerTimeDifference = 0;
    let gameState = {};
    let buttonState = { left: 'bet', right: 'bet' };
    let betSent = { left: false, right: false };
    let outSend = { left: false, right: false };
    let alrateUpdated = false; 
    let isFirstUpdate = true;
    let updateHistoryElement = true;
    let prevrateUpdated = true;
    const alrateCountElement = document.getElementById('alrate_count');
    const prevrateCountElement = document.getElementById('prevrates');
    var progressBar = document.querySelector('.message_laoding_line');
    var chatFormButton = document.getElementById('chat_form_button');
    let userInteracted = false;
    var game_btn_bet = getCookie('game_btn_bet');
    var game_btn_cancel = getCookie('game_btn_cancel');
    var game_btn_waiting = getCookie('game_btn_waiting');
    var game_btn_cashout = getCookie('game_btn_cashout');
    var win_minimodal_title = getCookie('win_minimodal_title');
    var win_minimodal_text = getCookie('win_minimodal_text');
    var bet_money_error_title = getCookie('bet_money_error_title');
    var bet_money_error_text = getCookie('bet_money_error_text');


    function handleUserInteraction() {
    userInteracted = true;
    document.removeEventListener('click', handleUserInteraction);
    document.removeEventListener('keydown', handleUserInteraction);
    }

    document.addEventListener('click', handleUserInteraction);
   document.addEventListener('keydown', handleUserInteraction);

    ws.onopen = function() {
        console.log('Connected to WebSocket server');
        ws.send(JSON.stringify({
            user_id: getCookie('user_id'),
            user_password: getCookie('user_password')
        }));
    };


ws.onerror = function(error) {
    console.log('WebSocket Error: ' + error);
    // Логика переподключения
    setTimeout(function() {
        ws = new WebSocket('wss://flyluckyjet.pro:2346');
        // Переподключение обработчиков событий, если необходимо
    }, 500);
};


ws.onmessage = function(event) {
    try {
        var message = JSON.parse(event.data);

        if (message.type === 'online_users') {
            document.getElementById('onlineUsers').innerText = message.count;
        } 
        else if (message.type === 'game_state') {
            updateGameState(message.state, message.coefficient, message.time_left, message.server_time, message.random_sid, message.manual_sid, message.server_sid);
            

            if (message.history && (message.state === "pause" || updateHistoryElement)) {
            updateHistory(message.history);
            updateHistoryElement = false;
            }
            else if(message.history && message.state === "ended"){
            updateHistoryElement = true;   
            }

            if(message.prevrates && (message.state === "pause" || prevrateUpdated)){
            updatePrevrate(message.prevrates);
            prevrateUpdated = false;
            }
            else if(message.prevrates && message.state === "ended"){
            prevrateUpdated = true;   
            }

            if (message.alrate && (message.state !== 'ended' || !alrateUpdated)) {
                updateallrate(message.alrate, message.state);

                if (message.state === 'pause') {
                    alrateUpdated = true; // Устанавливаем флаг после обновления перед стадией pause
                }
            }
            else if (message.state === 'ended') {
                document.getElementById('alrates').innerHTML = ''; // Удаление элементов
                isFirstUpdate = true; // Сбрасываем флаг при стадии ended для следующего первого вызова
            }


        }
        else if (message.type === 'user_bets') {
        updateUserBets(message.bets);
        } 
        else if (message.type === 'bet') {
            if (message.status === 'rejected') {
                showMessage('images/c993a73ab46cf278e05848024f0dc31e.svg', bet_money_error_title, bet_money_error_text);
            } 
            else if (message.status === 'incorrect') {
                showMessage('images/c993a73ab46cf278e05848024f0dc31e.svg', 'Неверная сумма ставки', 'Для совершения сделки укажите правильную сумму ставки');
            }
            else if (message.status === 'cashout') {
                var messwin = message.win.toFixed(2); 
                showWin(win_minimodal_title, `x${message.coef}`, messwin, win_minimodal_text);
            }  
        } 
        else if (message.type === 'bet_status') {
            updateBetStatus(message);
        }
        else if (message.type === 'balance_update') {
            updateBalance(parseFloat(message.balance)); 
        }
        else if (message.type === 'userrate_number') {
            const userRateNumber = message.value;
            updateAlrateCount(userRateNumber, 3000); // 3000 ms = 3 seconds duration for pause stage
        }
        else if(message.type === 'chat_message'){
          displayChatMessage(message.id, message.text);
        }
    } catch (e) {
        console.log(event)
        console.log(event.data)
        console.error('Error parsing message: ', e);
    }
};


    ws.onclose = function() {
        console.log('Disconnected from WebSocket server');
    };

    ws.onerror = function(error) {
        console.log('WebSocket Error: ' + error);
    };

    function getCookie(name) {
        let cookieArr = document.cookie.split(";");
        for (let i = 0; i < cookieArr.length; i++) {
            let cookiePair = cookieArr[i].split("=");
            if (name == cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
        return null;
    }

    function updateGameState(state, coefficient, time_left, server_time, random_sid_value, manual_sid_value, server_sid_value) {
        gameState.stage = state;
        gameState.coefficient = coefficient;
        gameState.time_left = time_left;
        gameState.server_time = server_time;
       
        const elements = document.querySelectorAll('.schedule-bg1, .schedule-bg2, .schedule-bg3, .schedule-bg4');
        var jet_animatsion = document.querySelector('.jet_animatsion');
        var jetloading = document.querySelector('.jet-main-laoding');
        var jetnumber = document.querySelector('.schedule-number');
        var jetnumberfinish = document.querySelector('.schedule-number-finish');
        var jet_waiting = document.querySelector('.jet_waiting');
        var timer = document.getElementById('timer');
        var progressLine = document.querySelector('.progress-line');
        var animationCheckbox = document.getElementById('animation_checkbox');
        var soundCheckbox = document.getElementById('sound_checkbox');
        var runningMusic = document.getElementById('running_music');
        var endedMusic = document.getElementById('ended_music');
        var random_sid_elem = document.getElementById('random_sids');
        var manual_sid_elem = document.getElementById('manual_sids');
        var server_sid_elem = document.getElementById('server_sids');

        var user_checkbox_left = document.getElementById('user_checkbox_left');
        var user_checkbox_right = document.getElementById('user_checkbox_right');

        if (server_time) {
            clientServerTimeDifference = server_time - performance.now() / 1000;
        }

        if (state === 'waiting') {
            isRunning = false;
            jetloading.style.opacity = '0';
            jetloading.style.visibility = 'hidden';
            jet_waiting.style.opacity = '1';
            jet_waiting.style.visibility = 'visible';
            jet_animatsion.style.opacity = '0';
            jetnumber.style.opacity = '0';
            timer.innerText = '1.00';
            elements.forEach(element => {
                element.style.animationPlayState = 'running';
            });
            $(".schedule-number-animated").removeClass("number-animated-active");
            progressLine.style.width = '100%';
            runningMusic.pause();
            runningMusic.currentTime = 0;
            endedMusic.pause();
            endedMusic.currentTime = 0;
        } else if (state === 'running' && !isRunning) {
            isRunning = true;
            luckyJet.start();
            resetBetSentFlags();
            
            elements.forEach(element => {
                if (animationCheckbox.checked) {
                    jet_animatsion.style.opacity = '1';
                } else {
                    jet_animatsion.style.opacity = '0';
                }
                element.style.animationPlayState = 'running';
                jetloading.style.opacity = '0';
                jetloading.style.visibility = 'hidden';
                jet_waiting.style.opacity = '0';
                jet_waiting.style.visibility = 'hidden';
                jetnumber.style.opacity = '1';
                jetnumberfinish.style.opacity = '0';
                $(".schedule-number-animated").removeClass("number-animated-active");
            });

            if (soundCheckbox.checked && runningMusic.paused && userInteracted) {
                runningMusic.play();
            }
        } 
        else if (state === 'running') {
            if (!isNaN(coefficient)) {
            timer.innerText = coefficient.toFixed(2);
            }
        } 
        else if (state === 'ended') {
            isRunning = false;
            luckyJet.end();
            elements.forEach(element => {
                element.style.animationPlayState = 'paused';
            });
            $(".schedule-number-animated").addClass("number-animated-active");
            timer.innerText = coefficient.toFixed(2);
            random_sid_elem.innerText = random_sid_value;
            manual_sid_elem.innerText = manual_sid_value;
            server_sid_elem.innerText = server_sid_value;


         
            if (!runningMusic.paused) {
                runningMusic.pause();
                runningMusic.currentTime = 0;
            }
            if (soundCheckbox.checked && endedMusic.paused && userInteracted) {
                endedMusic.play();
            }
         document.getElementById('alrates').innerHTML = ''; // Удаление элементов при стадии ended   
        } else if (state === 'pause') {
            isRunning = false;
            jetnumber.style.opacity = '0';
            jetnumberfinish.style.opacity = '1';
            jetloading.style.opacity = '1';
            jetloading.style.visibility = 'visible';
            jet_waiting.style.opacity = '0';
            jet_waiting.style.visibility = 'hidden';
            jet_animatsion.style.opacity = '0';
            timer.innerText = '1.00';

            let progressTimeLeft = time_left;
            let progressWidth = (progressTimeLeft / 3) * 100;

            progressLine.style.width = `${progressWidth}%`;
            progressLine.style.transition = `width ${progressTimeLeft}s linear`;
            progressLine.style.width = '0%';


            if(user_checkbox_left && user_checkbox_right){
                // Проверяем чекбоксы и отправляем ставки один раз
                if (document.getElementById('user_checkbox_left').checked && !betSent.left) {
                const betAmount = parseFloat(document.getElementById('bet_amount_input_left').value);
                sendBet(betAmount, 'left', 'bet');
                betSent.left = true;
                }
                if (document.getElementById('user_checkbox_right').checked && !betSent.right) {
                const betAmount = parseFloat(document.getElementById('bet_amount_input_right').value);
                sendBet(betAmount, 'right', 'bet');
                betSent.right = true;
                }  
            }
           
        }
    }

    function updateCoefficient(side, coefficient, bet_amount, status) {
        if (status === 'active') {
            const kefElement = document.getElementById(side === 'left' ? 'kef_left' : 'kef_right');
            if (kefElement) {
                var betcoef = bet_amount * coefficient;
                kefElement.innerText = betcoef.toFixed(2);
            }
        }
    }

    function resetBetSentFlags() {
        betSent.left = false;
        betSent.right = false;
    }


    function resetOutSentFlags() {
        outSend.left = false;
        outSend.right = false;
    }

    function updateAlrateCount(newNumber, duration) {
    let currentNumber = parseInt(alrateCountElement.textContent, 10);
    let stepDuration = duration / (currentNumber + newNumber);

        function countDownToZero(callback) {
            if (currentNumber > 0) {
                alrateCountElement.textContent = currentNumber--;
                setTimeout(() => countDownToZero(callback), stepDuration);
            } else {
                callback();
            }
        }

        function addNewNumber() {
            let targetNumber = newNumber;
            function increment() {
                if (targetNumber > 0) {
                    alrateCountElement.textContent = ++currentNumber;
                    targetNumber--;
                    setTimeout(increment, stepDuration);
                }
            }
            increment();
        }

        if (currentNumber > 0) {
            countDownToZero(addNewNumber);
        } else {
            addNewNumber();
        }
    }

 


    document.getElementById('animation_checkbox').addEventListener('change', function() {
        var jet_animatsion = document.querySelector('.jet_animatsion');
        if (this.checked) {
            if (isRunning) {
                jet_animatsion.style.opacity = '1';
            }
        } else {
            jet_animatsion.style.opacity = '0';
        }
    });

    document.querySelector('.sound').addEventListener('click', function() {
        var soundCheckbox = document.getElementById('sound_checkbox');
        soundCheckbox.checked = !soundCheckbox.checked;
        updateSoundIconAndOpacity(soundCheckbox);
    });

    document.getElementById('sound_checkbox').addEventListener('change', function() {
        updateSoundIconAndOpacity(this);
    });

    

    if (chatFormButton) {
        chatFormButton.addEventListener('click', function() {
            var inputField = document.getElementById('chat_form_input');
            var message = inputField.value.trim();

            if (message === "") return;

            // Запуск анимации загрузки
            document.querySelector('.jet_message_laoding').classList.add('d-block');
            progressBar.style.width = '100%';
            progressBar.animate([{ width: '100%' }, { width: '0%' }], {
                duration: 5000,
                easing: 'linear'
            }).onfinish = function() {
                document.querySelector('.jet_message_laoding').classList.remove('d-block');
                progressBar.style.width = '100%'; // Восстановление прогресс бара
            };

            // Отправка сообщения на сервер
            ws.send(JSON.stringify({
                action: 'send_message',
                user_id: getCookie('user_id'),
                user_password: getCookie('user_password'),
                message: message
            }));

            inputField.value = ''; // Очистка поля ввода
        });
    }




// Слушаем событие выбора GIF из gif.js
document.addEventListener('gifSelected', function(event) {
    const gifUrl = event.detail.gifUrl;
    const message = `<img src="${gifUrl}">`;

    // Начинаем анимацию отправки
    document.querySelector('.jet_message_laoding').classList.add('d-block');
    progressBar.style.width = '100%';

    // Запуск анимации
    progressBar.animate([{ width: '100%' }, { width: '0%' }], {
        duration: 5000,
        easing: 'linear'
    }).onfinish = function() {
      document.querySelector('.jet_message_laoding').classList.remove('d-block');
      progressBar.style.width = '100%'; // Восстановление прогресс бара
    };

    // Отправка сообщения на сервер
    ws.send(JSON.stringify({
        action: 'send_message',
        user_id: getCookie('user_id'),
        user_password: getCookie('user_password'),
        message: message
    }));

});

    document.addEventListener('click', function(event) {
        const shareButton = event.target.closest('.share_btn');
        if (shareButton) {
            const allRatesItem = shareButton.closest('.all_rates_item') || shareButton.closest('.my_tates_item');
            const dataId = allRatesItem.getAttribute('data-id');
            const isInsidePrevrates = allRatesItem.closest('#prevrates') !== null;
            const isInsideMinerrates = allRatesItem.closest('#minerates') !== null;

            if (dataId) {
                // Определяем блок, в котором находится кнопка
                const blockType = isInsidePrevrates ? 'prevrates' : isInsideMinerrates ? 'minerates' : 'unknown';

                // Начинаем анимацию отправки
                document.querySelector('.jet_message_laoding').classList.add('d-block');
                progressBar.style.width = '100%';

                // Запуск анимации
                progressBar.animate([{ width: '100%' }, { width: '0%' }], {
                duration: 5000,
                easing: 'linear'
                }).onfinish = function() {
                document.querySelector('.jet_message_laoding').classList.remove('d-block');
                progressBar.style.width = '100%'; // Восстановление прогресс бара
                };

                // Отправка данных на сервер
               ws.send(JSON.stringify({
                    action: 'share_bet',
                    user_id: getCookie('user_id'),
                    user_password: getCookie('user_password'),
                    bet_id: dataId,
                    blockType: blockType
                }));

            }
        }
    });




    function updateSoundIconAndOpacity(soundCheckbox) {
        var soundButton = document.querySelector('.sound i');
        var soundDiv = document.querySelector('.sound');
        var animationSoundButton = document.querySelector('.animation_sound i');
        if (soundCheckbox.checked) {
            soundDiv.style.opacity = '1';
            soundButton.className = 'fa-solid fa-volume-low';
            animationSoundButton.className = 'fa-solid fa-volume-low';
        } else {
            soundDiv.style.opacity = '0.4';
            soundButton.className = 'fa-solid fa-volume-xmark';
            animationSoundButton.className = 'fa-solid fa-volume-xmark';
        }
    }

   async function updateHistory(history) {
    const betHistory = document.getElementById('bet_history');
    const betHistoryModal = document.getElementById('bet_history_modal');
    betHistory.innerHTML = '';
    betHistoryModal.innerHTML = '';

    const historyItems = history.map(item => {
        return `<div class="rate_history_content_items">
            <div class="rate_history_content_item ${item.class}">
                ${item.coefficient}x
            </div>
        </div>`;
    });

    // Используем requestAnimationFrame для обновления DOM асинхронно
    await new Promise(resolve => requestAnimationFrame(resolve));
    betHistory.innerHTML = historyItems.join('');
    betHistoryModal.innerHTML = historyItems.join('');
}


function adjustFontSize(element) {
  const characterCount = getCharacterCount(element);

  if (characterCount == 8) {
    element.style.fontSize = '10px';
  } else if (characterCount > 8) {
    element.style.fontSize = '9px';
  } else {
    element.style.fontSize = '11px';  
  }
}

function getCharacterCount(element) {
  return element.textContent.trim().length;
}

function updatePrevrate(prevrates) {
    prevrateCountElement.innerHTML = '';
    prevrates.forEach(item => {
        let prevratesItem;
        if (parseInt(item.all_running, 10) === 1) {
            prevratesItem =` 
            <div class="all_rates_item all_rates_item_active" data-id="${item.id}">
                <div class="all_rates_item_ava" style="background:${item.all_color};">${item.all_nick}</div>     
                <div class="all_rates_item_username">${item.all_name}</div>
                <div class="all_rates_item_price dynamic-font"><span>${item.all_bet}</span> <i class="fa-solid fa-dollar-sign"></i></div>
                <div class="all_rates_item_raund_x all_rates_item_raund_x_active ${item.class}">${item.all_coefficient}x</div>
                <div class="all_rates_item_raund_win all_rates_item_raund_win_active dynamic-font"><span>${item.all_win}</span> <i class="fa-solid fa-dollar-sign"></i></div>
                <div class="share_btn"><img src="images/share.svg"></div>
            </div>`;
        } else {
            prevratesItem =` 
            <div class="all_rates_item" data-id="${item.id}">
                <div class="all_rates_item_ava" style="background:${item.all_color};">${item.all_nick}</div>     
                <div class="all_rates_item_username">${item.all_name}</div>
                <div class="all_rates_item_price dynamic-font"><span>${item.all_bet}</span> <i class="fa-solid fa-dollar-sign"></i></div>
                <div class="all_rates_item_raund_x">${item.all_coefficient}</div>
                <div class="all_rates_item_raund_win">${item.all_win}</div>
                <div class="share_btn"><img src="images/share.svg"></div>
            </div>`;
        }
        prevrateCountElement.innerHTML += prevratesItem;
    });
// Обновление размера шрифта для новых элементов с классом dynamic-font
  const elements = document.querySelectorAll('.dynamic-font');
  elements.forEach(element => {
    adjustFontSize(element);
  });

}


// Функция для отображения сообщений чата
function displayChatMessage(id, text) {

 var chatBody = document.getElementById('chat_body');
    if (chatBody) {
        // Проверяем, существует ли уже сообщение с таким id
        if (document.querySelector(`.chat_message[data-id="${id}"]`)) {
            return; // Сообщение уже добавлено
        }

        
        // Создаем и добавляем новое сообщение
        var messageElement = document.createElement('div');
        messageElement.className = 'chat_message';
        messageElement.setAttribute('data-id', id);
        messageElement.innerHTML = text;
        chatBody.appendChild(messageElement);

        

        // Прокрутка к последнему сообщению
        scrollToLastMessage();
    }
}

// Обновление высоты chat_body
function updateChatBodyHeight() {
    var chatBody = document.getElementById('chat_body');
    if (chatBody) {
        const headerchat = document.querySelector('.header').offsetHeight;
        const chat_header = document.querySelector('.chat_header').offsetHeight;
        const chat_bottom_btn_block = document.querySelector('.chat_bottom_btn_block').offsetHeight || 0;

        const totalOffsetchat = headerchat + chat_header + chat_bottom_btn_block;
        const newHeightchat = window.innerHeight - totalOffsetchat;
        chatBody.style.height = `${newHeightchat}px`;
    }
}

// Прокрутка к последнему сообщению при первой загрузке
setTimeout(() => {
    updateChatBodyHeight();
    scrollToLastMessage();
}, 1000);

function scrollToLastMessage() {
    var chatBody = document.getElementById('chat_body');
    if (chatBody) {
    chatBody.scrollTop = chatBody.scrollHeight;
    }
}




function updateallrate(allrate, state) {
    const alrates = document.getElementById('alrates');
    if (!alrates) {
        return;
    }

    // Удаление элементов только при первом вызове функции
    if (isFirstUpdate) {
        alrates.innerHTML = '';
        isFirstUpdate = false; // Сбрасываем флаг после первого вызова
    }

    const existingIds = new Set();
    
    allrate.forEach((item) => {
        existingIds.add(item.id);
        let existingItem = document.querySelector(`#alrates .all_rates_item[data-id='${item.id}']`);
        if (existingItem) {
            // Обновляем существующий элемент, если allRunning = 1
            if (parseInt(item.all_running, 10) === 1 && state === 'running') {
                let roundX = existingItem.querySelector('.all_rates_item_raund_x');
                let roundWin = existingItem.querySelector('.all_rates_item_raund_win');
                let roundClass = existingItem.querySelector('.all_rates_item_raund_x').classList;

                roundX.innerHTML = `${item.all_coefficient}x`;
                roundWin.innerHTML = `<span>${item.all_win}</span> <i class="fa-solid fa-dollar-sign"></i>`;
                roundClass.add(item.class);
                roundClass.remove('all_rates_item_raund_x_active'); // Удаление старого класса, если есть
                roundClass.add('all_rates_item_raund_x_active'); // Добавление нового класса
                roundWin.classList.remove('all_rates_item_raund_win_active');
                roundWin.classList.add('all_rates_item_raund_win_active');
            }
        } else {
            // Создаем новый элемент
            let allrateItem;
            allrateItem = `
            <div class="all_rates_item" data-id="${item.id}">
                <div class="all_rates_item_ava" style="background:${item.all_color};">${item.all_nick}</div>
                <div class="all_rates_item_username">${item.all_name}</div>
                <div class="all_rates_item_price dynamic-font"><span>${item.all_bet}</span> <i class="fa-solid fa-dollar-sign"></i></div>
                <div class="all_rates_item_raund_x">-</div>
                <div class="all_rates_item_raund_win dynamic-font">-</div>
            </div>`;

            const div = document.createElement('div');
            div.innerHTML = allrateItem;
            const rateItem = div.firstElementChild; // Извлекаем первый дочерний элемент

            alrates.appendChild(rateItem); // Добавление элемента без задержки
        }
    });

    // Удаление дублирующихся элементов
    document.querySelectorAll('#alrates .all_rates_item').forEach(item => {
        if (!existingIds.has(item.getAttribute('data-id'))) {
            item.remove();
        }
    });

    // Обновление размера шрифта для новых элементов с классом dynamic-font
  const elements = document.querySelectorAll('.dynamic-font');
  elements.forEach(element => {
    adjustFontSize(element);
  });

}


function updateUserBets(bets) {
    const myBetsContainer = document.getElementById('minerates');

    // Очищаем контейнер ставок
    myBetsContainer.innerHTML = '';

    if (bets.length === 0) {
        // Если ставок нет, выводим пустые блоки
        for (let i = 0; i < 10; i++) {
            const emptyBet = `
                <div class="place_rate">
                    <div class="place_rate_img"></div>
                    <div class="place_rate_name"></div>
                    <div class="place_rate_sum"></div>
                    <div class="place_rate_x"></div>
                    <div class="place_rate_rez"></div>
                </div>`;
            myBetsContainer.innerHTML += emptyBet;
        }
    } else {
        // Если ставки есть, выводим их
        bets.forEach(bet => {
        let betItem;

        if(parseInt(bet.coefficient, 10) > 0){
        betItem = `
                <div class="my_tates_item all_rates_item_active" data-id="${bet.id}">
                    <div class="my_rates_item_time">${bet.time}</div>
                    <div class="my_rates_item_price dynamic-font"><span>${bet.bet_amount}</span> <i class="fa-solid fa-dollar-sign"></i></div>
                    <div class="all_rates_item_raund_x all_rates_item_raund_x_active ${bet.class}">${bet.coefficient}x</div>
                    <div class="all_rates_item_raund_win mybet_minwidth dynamic-font"><span>${bet.win_amount}</span> <i class="fa-solid fa-dollar-sign"></i></div>
                    <div class="share_btn"><img src="images/share.svg"></div>
                </div>`;
        }
        else{
        betItem = `
                <div class="my_tates_item" data-id="${bet.id}">
                    <div class="my_rates_item_time">${bet.time}</div>
                    <div class="my_rates_item_price dynamic-font"><span>${bet.bet_amount}</span> <i class="fa-solid fa-dollar-sign"></i></div>
                    <div class="all_rates_item_raund_x all_rates_item_raund_x_active">${bet.coefficient}</div>
                    <div class="all_rates_item_raund_win mybet_minwidth">${bet.win_amount}</div>
                     <div class="share_btn"><img src="images/share.svg"></div>
                </div>`;    

        }


            
        myBetsContainer.innerHTML += betItem;
        });
    }
}



    function updateBetStatus(message) {
        const { status, side, bet_amount, game_stage } = message;
        let button = side === 'left' ? document.getElementById('make_bet_left') : document.getElementById('make_bet_right');

        if (!button) {
            const potentialIds = [
                `make_bet_${side}`,
                `make_cancel_${side}`,
                `make_cashout_${side}`,
                `make_waiting_${side}`
            ];

            for (const id of potentialIds) {
                button = document.getElementById(id);
                if (button) break;
            }
        }

        if (!button) {
            console.error(`Button for side ${side} not found`);
            return;
        }

       

        if (status === 'pending') {
            if (buttonState[side] !== 'cancel') {
                updateButtonState(button, 'cancel', button.id.replace('make_bet', 'make_cancel'), game_btn_cancel, 'button_cancellation', ['button_bet']);
                buttonState[side] = 'cancel';
            }
        } else if (status === 'active') {
            if (game_stage === 'pause') {
                if (buttonState[side] !== 'waiting') {
                    updateButtonState(button, 'waiting', button.id.replace('make_cancel', 'make_waiting'), game_btn_waiting, null, ['button_cancellation']);
                    buttonState[side] = 'waiting';
                    resetOutSentFlags();
                }
            } 
            else if (game_stage === 'running' && buttonState[side] !== 'cashout') {
                updateButtonState(button, 'cashout', `make_cashout_${side}`, game_btn_cashout, 'button_take', null, bet_amount);
                buttonState[side] = 'cashout';
            } 
            else if (game_stage !== 'running' && buttonState[side] !== 'bet') {
                updateButtonState(button, 'bet', `make_bet_${side}`, game_btn_bet, 'button_bet', ['button_cancellation', 'button_take']);
                buttonState[side] = 'bet';
            }
            if (game_stage === 'running') {
                updateCoefficient(side, gameState.coefficient, bet_amount, status);
                // Проверяем чекбоксы и отправляем ставки один раз
                if (document.getElementById('user_output_left').checked && !outSend.left) { 
                const outcoefleft = parseFloat(document.getElementById('coef_input_left').value);
                    if(gameState.coefficient >= outcoefleft){
                    cashOut('left');
                    outSend.left = true;
                    }
                
                }
                
                if (document.getElementById('user_output_right').checked && !outSend.right) {
                const outcoefright = parseFloat(document.getElementById('coef_input_right').value);
                   if(gameState.coefficient >= outcoefright){
                    cashOut('right');
                    outSend.right = true;
                    }
               
                }
            }
        } else {
            if (buttonState[side] !== 'bet') {
                updateButtonState(button, 'bet', `make_bet_${side}`, game_btn_bet, 'button_bet', ['button_cancellation', 'button_take']);
                buttonState[side] = 'bet';
            }
        }
    }

    function updateButtonState(button, newType, newId, newText, newClassToAdd, newClassToRemove, betAmount = null) {
       if (button) {
        button.setAttribute('type', newType);
        button.setAttribute('id', newId);
        if (betAmount !== null) {
            button.innerHTML = `<div type="${newType}" class="make_bet_button_div">
                    <div class="button_cashOut_text">
                        <span id="${newId.includes('left') ? 'kef_left' : 'kef_right'}">${betAmount}</span>
                        <i class="fa-solid fa-dollar-sign"></i>
                    </div>
                    <div>${newText}</div>
                </div>`;
        } else {
            button.innerHTML = `<div type="${newType}" class="make_bet_button_div">
                    <div>${newText}</div>
                </div>`;
        }
        button.className = 'make_bet_button';
        if (newClassToRemove) {
            if (Array.isArray(newClassToRemove)) {
                newClassToRemove.forEach(cls => button.classList.remove(cls));
            } else {
                button.classList.remove(newClassToRemove);
            }
        }
        if (newClassToAdd) {
            button.classList.add(newClassToAdd);
        }
    }
    }

    function updateBalance(balance) {
    if (!isNaN(balance)) {  // Проверяем, является ли значение числом
        document.getElementById('balance').innerText = balance.toFixed(2);
    }
    }


    document.addEventListener('click', function(event) {
        if (event.target.closest('#make_bet_left')) {
            handleBetButtonClick(event);
            buttonState['left'] = 'bet';
        } else if (event.target.closest('#make_bet_right')) {
            handleBetButtonClick(event);
            buttonState['right'] = 'bet';
        } else if (event.target.closest('#make_cancel_left')) {
            cancelBet('left');
            buttonState['left'] = 'cancel';
        } else if (event.target.closest('#make_cancel_right')) {
            cancelBet('right');
            buttonState['right'] = 'cancel';
        } else if (event.target.closest('#make_cashout_left')) {
            cashOut('left');
        } else if (event.target.closest('#make_cashout_right')) {
            cashOut('right');
        }
    });

    function handleBetButtonClick(event) {
        const button = event.target.closest('button');
        const betAmountInputId = button.id.includes('left') ? 'bet_amount_input_left' : 'bet_amount_input_right';
        const betAmount = parseFloat(document.getElementById(betAmountInputId).value);
        sendBet(betAmount, button.id.includes('left') ? 'left' : 'right', 'bet');
        
    }

    function sendBet(betAmount, side, action) {
        ws.send(JSON.stringify({
            action: action,
            user_id: getCookie('user_id'),
            user_password: getCookie('user_password'),
            bet_amount: betAmount,
            side: side
        }));
    }

    function cancelBet(side) {
        const button = side === 'left' ? document.getElementById('make_cancel_left') : document.getElementById('make_cancel_right');
      
        ws.send(JSON.stringify({
            action: 'cancel',
            user_id: getCookie('user_id'),
            user_password: getCookie('user_password'),
            side: side
        }));
        updateButtonState(button, 'bet', `make_bet_${side}`, game_btn_bet, 'button_bet', ['button_cancellation']);
    }

    function cashOut(side) {
        const button = side === 'left' ? document.getElementById('make_cashout_left') : document.getElementById('make_cashout_right');
        ws.send(JSON.stringify({
            action: 'cashout',
            user_id: getCookie('user_id'),
            user_password: getCookie('user_password'),
            side: side
        }));
        updateButtonState(button, 'bet', `make_bet_${side}`, game_btn_bet, 'button_bet', ['button_cancellation']);
     }



console.log("successes37");
});
