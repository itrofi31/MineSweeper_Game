class Minesweeper {
  //   grid = null;
  // blur = null;
  // gameOverWindow = null;
  cells = [];
  isGameOver = false;
  flagsCounter = 0;
  clicks = 0;
  clickCounter = 0;
  timers = { sec: 0, min: 0 };
  size = 10;
  mines = 10;
  sound = 'on';
  gameNum = 1;
  player = [];

  init() {
    //create elements
    const fragment = document.createDocumentFragment();

    this.grid = this.createEl('div', 'grid');
    this.blur = this.createEl('div', 'blur');
    this.stats = this.createEl('div', 'stats');
    this.rules = this.createEl('p', 'stats__rules', `Find 10 mines`);
    this.minesInput = this.createEl('input', 'stats__input');
    this.minesInput.setAttribute('placeholder', 'Enter number of mines');
    this.minesBtn = this.createEl('button', 'stats__btn', 'ok');
    this.soundOn = this.createEl('span', 'stats__sound--on', '🔊 on');
    this.soundOn.classList.add('active');
    this.soundOff = this.createEl('span', 'stats__sound--off', '🔇 off');
    this.timer = this.createEl('p', 'stats__timer', '⏳ Time: ');
    this.counter = this.createEl('p', 'stats__counter', '🖱️ Clicks: ');
    this.counter.append(this.createEl('span', 'stats__counter-click', '0'));
    this.flags = this.createEl(
      'p',
      'stats__flags',
      '⛳️ Flags used (right click): '
    );
    this.flags.append(this.createEl('span', 'stats__counter-flag', '0'));

    this.stats.append(
      this.rules,
      this.minesInput,
      this.minesBtn,
      this.soundOn,
      this.soundOff,
      this.timer,
      this.counter,
      this.flags
    );
    fragment.append(this.createHeader(), this.grid, this.blur, this.stats);
    document.body.append(fragment);
    // this.createLayout(this.size, this.mines);
    this.createCells(this.size, this.mines);
    this.timerStart();
    this.enterMinesNumber();
    this.minesInput.focus();
    this.controlSound();

    const savedResults = localStorage.getItem('results');
    if (savedResults) {
      this.player = JSON.parse(savedResults);
      console.log(this.player);
    }
  }

  createEl(el, className, text) {
    const element = document.createElement(el);
    element.classList.add(className);
    element.textContent = text;
    return element;
  }

  createHeader() {
    const header = this.createEl('div', 'header');
    const h1 = this.createEl('h1', 'h1', 'Minesweeper game 🔍💣');
    this.sizeMenu = this.createEl('div', 'menu');

    this.btnSize10 = this.createEl('div', 'menu__btn', 'Easy: 10x10');
    this.btnSize10.classList.add('menu__btn--active');
    this.btnSize15 = this.createEl('div', 'menu__btn', 'Easy: 15x15');
    this.btnSize25 = this.createEl('div', 'menu__btn', 'Easy: 25x25');

    this.sizeMenu.append(this.btnSize10, this.btnSize15, this.btnSize25);

    header.append(h1, this.sizeMenu);

    this.btnSize10.addEventListener('click', () => {
      this.changeSize(10, this.mines);
      this.btnSize10.classList.add('menu__btn--active');
    });
    this.btnSize15.addEventListener('click', () => {
      this.changeSize(15, this.mines);
      this.btnSize15.classList.add('menu__btn--active');
    });
    this.btnSize25.addEventListener('click', () => {
      this.changeSize(25, this.mines);
      this.btnSize25.classList.add('menu__btn--active');
    });

    return header;
  }

  changeSize(size, mines) {
    this.size = size;
    this.startAgain.bind(this, size, mines)();
    this.sizeMenu.querySelectorAll('.menu__btn').forEach((btn) => {
      if (btn.classList.contains('menu__btn--active'))
        btn.classList.remove('menu__btn--active');
    });
  }

  // createLayout(size, mines) {
  //   this.grid.innerHTML = '';
  //   for (let i = 0; i < size * size; i++) {
  //     const cell = this.createEl('div', 'cell');
  //     this.grid.append(cell);

  //     //add click function
  //     cell.addEventListener('click', () => {
  //       this.grid.innerHTML = '';
  //       this.createCells(size, mines);
  //       this.stats.insertAdjacentElement('afterBegin', this.rules);
  //       // alert('Mines are successfully placed!');
  //     });
  //   }
  // }

  createCells(size, mines) {
    // create arrays
    const minesArr = Array(mines).fill('mine');
    const emptyArr = Array(size * size - mines).fill('valid');
    const gameArr = minesArr.concat(emptyArr);
    const shuffleArr = gameArr.sort(() => Math.random() - 0.5);
    const audio = new Audio('../sound/click.wav');

    const startMessage = this.createEl(
      'div',
      'start-message',
      `Click any cell or choose number of mines to start`
    );
    this.grid.append(startMessage);
    document.body.addEventListener('click', () => startMessage.remove());

    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement('div');
      cell.classList.add(`${shuffleArr[i]}`, 'cell');
      cell.setAttribute('id', i);
      this.grid.append(cell);
      this.cells.push(cell);

      //add click function
      cell.addEventListener('click', () => {
        this.click(cell);
        this.clicks++;
        this.renderClicks();
        // this.grid.innerHTML = '';

        this.stats.insertAdjacentElement('afterBegin', this.rules);

        if (this.sound === 'on') {
          audio.play();
        }
      });

      // add flag when right click
      cell.oncontextmenu = (e) => {
        e.preventDefault();
        this.addFlag(cell);
      };
    }
    for (let i = 0; i < this.cells.length; i++) {
      const isLeftEdge = i % size === 0;
      const isRightEdge = i % size === size - 1;
      let total = 0;

      if (this.cells[i].classList.contains('valid')) {
        //prettier-ignore
        if (i > 0 && !isLeftEdge && this.cells[i - 1].classList.contains('mine')) total ++
        //prettier-ignore
        if (i > size - 1 && !isRightEdge && this.cells[i + 1 - size].classList.contains('mine')) total ++
        //prettier-ignore
        if (i > size && this.cells[i - size].classList.contains('mine')) total ++
        //prettier-ignore
        if (i > size+1 && !isLeftEdge && this.cells[i - 1 - size].classList.contains('mine')) total ++
        //prettier-ignore
        if (i < size**2 - 2 && !isRightEdge && this.cells[i + 1].classList.contains('mine')) total ++
        //prettier-ignore
        if (i < (size**2) - (size) && !isLeftEdge && this.cells[i - 1 + size].classList.contains('mine')) total ++
        //prettier-ignore
        if (i < (size**2) - (size+1) && !isRightEdge && this.cells[i + 1 + size].classList.contains('mine')) total ++
        //prettier-ignore
        if (i < (size**2) - (size+1) && this.cells[i + size].classList.contains('mine')) total ++

        this.cells[i].setAttribute('data', total);
      }
    }
  }

  click(cell) {
    const curID = cell.id;
    if (this.isGameOver) return;
    if (cell.classList.contains('checked') || cell.classList.contains('flag'))
      return;
    if (cell.classList.contains('mine')) this.gameOver('BOOM 💥 Game Over❗️');
    else {
      this.clickCounter++;
      this.checkForWin(this.mines);
      let total = cell.getAttribute('data');
      cell.classList.add('checked');
      if (total != 0) {
        this.addColor(cell, total);
        cell.innerHTML = total;
        return;
      }
      this.checkCell(this.size, curID);
    }

    cell.classList.add('checked');
  }

  checkCell(size, curID) {
    const isLeftEdge = curID % size === 0;
    const isRightEdge = curID % size === size - 1;
    setTimeout(() => {
      if (curID > 0 && !isLeftEdge) {
        const newId = this.cells[+curID - 1].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
      if (curID > size - 1 && !isRightEdge) {
        const newId = this.cells[+curID + 1 - size].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
      if (curID > size) {
        const newId = this.cells[+curID - size].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
      if (curID > size + 1 && !isLeftEdge) {
        const newId = this.cells[+curID - 1 - size].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
      if (curID < size ** 2 - 2 && !isRightEdge) {
        const newId = this.cells[+curID + 1].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
      if (curID < size ** 2 - size && !isLeftEdge) {
        const newId = this.cells[+curID - 1 + size].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
      if (curID < size ** 2 - (size + 1) && !isRightEdge) {
        const newId = this.cells[+curID + 1 + size].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
      if (curID < size ** 2 - (size + 1)) {
        const newId = this.cells[+curID + size].id;
        const newCell = document.getElementById(newId);
        this.click(newCell);
      }
    }, 10);
  }

  addFlag(cell) {
    if (this.isGameOver) return;
    if (!cell.classList.contains('flag')) {
      cell.classList.add('flag');
      cell.innerHTML = '⁉️';
      this.flagsCounter++;
      this.flags.querySelector('span').innerHTML = this.flagsCounter;

      this.checkForWin();
    } else {
      cell.classList.remove('flag');
      cell.innerHTML = '';
      this.flagsCounter--;
      this.flags.querySelector('span').innerHTML = this.flagsCounter;
    }
  }

  gameOver(results) {
    const audioBoom = new Audio('../sound/boom.mov');
    const audioWin = new Audio('../sound/win.mov');

    for (let mine of this.cells) {
      if (mine.classList.contains('mine')) {
        mine.innerHTML = '💣';
        mine.classList.add('fail');
      }
    }

    if (results === 'WOOOW you are awesome‼️💫') {
      this.player.unshift(results);
      this.player.length > 10 ? this.player.pop() : 0;
      localStorage.setItem('results', JSON.stringify(this.player));
    }
    if (this.sound === 'on') {
      results === 'WOOOW you are awesome‼️💫'
        ? audioWin.play()
        : audioBoom.play();
    }
    this.isGameOver = true;

    this.gameOverWindow = this.createEl('div', 'gameover');
    const gameOverText = this.createEl('h2', 'gameover__title', `${results}`);
    const gameOverBtn = this.createEl(
      'button',
      'gameover__btn',
      'Start again ?'
    );
    this.gameOverWindow.append(gameOverText, gameOverBtn);
    document.body.append(this.gameOverWindow);
    this.blur.classList.add('show');
    this.size = 10;
    this.mines = 10;
    this.rules.textContent = `Find ${this.mines} mines`;

    //push results to local storage

    console.log(this.player);
    document
      .querySelector('.gameover__btn')
      .addEventListener('click', this.startAgain.bind(this, this.size, 10));
  }

  checkForWin(mines) {
    if (this.size === 10) {
      if (this.clickCounter === 100 - mines) {
        this.gameOver('WOOOW you are awesome‼️💫');
      } else return;
    }
    if (this.size === 15) {
      if (this.clickCounter === 225 - mines) {
        this.gameOver('WOOOW you are awesome‼️💫');
      } else return;
    }
    if (this.size === 25) {
      if (this.clickCounter === 625 - mines) {
        this.gameOver('WOOOW you are awesome‼️💫');
      } else return;
    }
  }

  startAgain(size, mines) {
    this.gameOverWindow?.remove();
    this.blur?.remove();
    this.grid.innerHTML = '';

    this.counter.querySelector('.stats__counter-click').innerHTML = '0';
    this.flags.querySelector('.stats__counter-flag').innerHTML = '0';
    this.cells = [];
    this.timers.sec = 0;
    this.timers.min = 0;
    this.clicks = 0;
    this.clickCounter = 0;
    this.flagsCounter = 0;
    this.minesInput.value = '';
    this.gameNum++;
    this.isGameOver = false;
    this.sizeMenu.querySelectorAll('.menu__btn').forEach((btn) => {
      btn.classList.contains('menu__btn--active')
        ? btn.classList.remove('menu__btn--active')
        : 1;
    });
    if (this.size === 10) this.btnSize10.classList.add('menu__btn--active');
    if (this.size === 15) this.btnSize15.classList.add('menu__btn--active');
    if (this.size === 25) this.btnSize25.classList.add('menu__btn--active');
    if (this.grid.classList.contains('grid--medium'))
      this.grid.classList.remove('grid--medium');
    if (this.grid.classList.contains('grid--large'))
      this.grid.classList.remove('grid--large');

    if (size === 15) {
      this.grid.classList.add('grid--medium');
    }
    if (size === 25) {
      this.grid.classList.add('grid--large');
    }
    // this.createLayout(this.size, mines);
    this.createCells(this.size, this.mines);
  }

  timerStart() {
    let span = document.createElement('span');

    this.timer.append(span);

    setInterval(() => {
      if (!this.isGameOver) {
        if (this.timers.sec >= 60) {
          this.timers.sec = 0;
          this.timers.min++;
        }
        span.innerHTML = `${this.timers.min} min ${this.timers.sec} sec`;
        this.timers.sec++;
      } else {
        span.innerHTML = `${this.timers.min} min ${this.timers.sec} sec`;
      }
    }, 1000);
  }

  renderClicks() {
    this.counter.querySelector('span').innerHTML = this.clicks;
  }

  addColor(cell, total) {
    cell.style.color = 'darkseagreen';
    switch (total) {
      case '2':
        cell.style.color = 'midnightblue';
        break;
      case '3':
        cell.style.color = 'coral';
        break;
      case '4':
        cell.style.color = 'purple';
        break;
      case '5':
        cell.style.color = 'darkslategreen';
        break;
      case '6':
        cell.style.color = 'blue';
        break;
      case '7':
        cell.style.color = 'brown';
        break;
      case '8':
        cell.style.color = 'green';
        break;
      case '9':
        cell.style.color = 'crimson';
        break;

      default:
        break;
    }
  }

  putMines() {
    this.mines = +this.minesInput.value;
    this.rules.textContent = `Find ${this.mines} mines`;
  }

  enterMinesNumber() {
    this.minesInput.addEventListener('click', function () {
      this.value = '';
    });
    this.minesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (+this.minesInput.value >= 10 && +this.minesInput.value < 100) {
        this.putMines();
      } else alert('Number of mines shuold be 10-99');
      this.startAgain(this.size, this.mines);
    });
  }

  controlSound() {
    this.stats.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('stats__sound--on')) {
        target.classList.add('active');
        this.soundOff.classList.remove('active');
        this.sound = 'on';
      }
      if (target.classList.contains('stats__sound--off')) {
        target.classList.add('active');
        this.soundOn.classList.remove('active');
        this.sound = 'off';
      }
    });
  }
}
const minesweeper = new Minesweeper();
minesweeper.init();
