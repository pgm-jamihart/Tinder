(() => {
  const app = {
    initialize () {
      moment.locale('nl-be');

      this.tinderApi = new TinderApi();

      this.users = null;
      this.messagesReceived = null;
      this.messagesSent = null;
      this.messageSenderIdreceiver = null;
      this.conversation = null;

      this.currentUserId = null;
      this.currentMessage = null;

      this.cacheElements();
      this.registerListeners();
      this.fetchUsers();
      this.setActiveUser();
      this.fetchReceivedMessages();
      this.setActiveReceivedMessage();
      this.fetchSentMessages();
      this.setActiveSentMessage();
      this.fetchConversationBetweenUsers();
      this.fetchMatchesForUser();
      this.listenersMatches();
    },

    cacheElements () {
      this.$usersList = document.querySelector('.users__list');
      this.$messagesReceived = document.querySelector('.messages__received__list');
      this.$messagesSent = document.querySelector('.messages__sent__list');
      this.$conversationList = document.querySelector('.conversation__list');
      this.$conversationImageAndUser = document.querySelector('.conversation__image-and-user');
      this.$formSendMessage = document.querySelector('#form__send__message');
      this.$verzendButton = document.querySelector('#verzend__button');
      this.$txtMessage = document.querySelector('#txtMessage');
      this.$matchMakerNoMatchList = document.querySelector('.matchmaker__no-match__list');
      this.$matchMakerMatchList = document.querySelector('.matchmaker__match__list');
    },

    registerListeners () {
      this.$usersList.addEventListener('click', (event) => {
        const userId = event.target.dataset.id || event.target.parentNode.dataset.id || event.target.parentNode.parentNode.dataset.id;
        this.setActiveUser(userId);
      });

      this.$messagesReceived.addEventListener('click', (event) => {
        const messageId = event.target.dataset.id || event.target.parentNode.dataset.id || event.target.parentNode.parentNode.dataset.id;
        this.setActiveReceivedMessage(messageId);
      });

      this.$messagesSent.addEventListener('click', (event) => {
        const messageId = event.target.dataset.id || event.target.parentNode.dataset.id || event.target.parentNode.parentNode.dataset.id;
        this.setActiveSentMessage(messageId);
      });

      this.$formSendMessage.addEventListener('submit', async event => {
        event.preventDefault();
        
        const messageToCreate = {
          message: event.target['txtMessage'].value,
          senderId: this.currentUserId,
          receiverId: this.currentMessage,
        }

        await this.tinderApi.addMessageBetweenUsers(messageToCreate);
        this.fetchSentMessages(this.currentUserId)

        this.$txtMessage.value = '';
      });

      
    },

    async fetchUsers () {
      this.users = await this.tinderApi.getUsers();
      this.updateUsersUi();

      const userId = this.users[0].id;
      this.setActiveUser(userId);
    },
    setActiveUser (userId) {
      this.currentUserId = userId; 
      const $selectedUser = this.$usersList.querySelector(`.users__list-item.selected`);
      if ($selectedUser !== null) {
        $selectedUser.classList.remove('selected')
      }
      this.$usersList.querySelector(`.users__list-item > a[data-id="${userId}"]`).parentNode.classList.add('selected');
      this.fetchReceivedMessages(userId);
      this.fetchSentMessages(userId);
      this.fetchConversationBetweenUsers();
      this.fetchMatchesForUser(userId);
    },
    updateUsersUi () {
      let tempStr = this.users.map((u) => {
        return `
        <li class="users__list-item">
          <a class="users__list-item__link" href="#" data-id=${u.id}>
            <img class="users__list-item__link__img" src="${u.picture.thumbnail}">
            <span class="">${u.firstName} ${u.lastName}</span>
          </a>
        </li>
        `;
      }).join('');
      this.$usersList.innerHTML = tempStr;
    },

    async fetchReceivedMessages (userId) {
      this.messagesReceived = await this.tinderApi.getReceivedMessagesFromUser(userId);
      this.updateReceivedMessagesUi();

      const messageId = this.messagesReceived[0].senderId;
      this.setActiveReceivedMessage(messageId);
    },
    setActiveReceivedMessage (messageIdReceived) {
      this.currentMessage = messageIdReceived; 
      const $selectedMessage = this.$messagesReceived.querySelector(`.messages__received__list-item.selected`);
      if ($selectedMessage !== null) {
        $selectedMessage.classList.remove('selected')
      }
      this.$messagesReceived.querySelector(`.messages__received__list-item > a[data-id="${messageIdReceived}"]`).parentNode.classList.add('selected');
      
      document.querySelector('.messages__received .amount').innerHTML = `<span>${this.messagesReceived.length}</span>`
      this.fetchConversationBetweenUsers();
    },
    updateReceivedMessagesUi () {
      const dateStettings = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute : 'numeric', second: 'numeric'
      };

      let tempStr = '';
      tempStr = this.messagesReceived.map((r) => {
        return `
        <li class="messages__received__list-item">
          <a href="#" data-id=${r.senderId}>
            <div class="container__messages__name-and-date">
              <span class="messages__sent__name">${this.users.find(u => u.id === r.senderId).firstName} ${this.users.find(u => u.id === r.senderId).lastName}</span>
              <span class="date__message">${new Date(r.createdAt).toLocaleDateString('nl-BE', dateStettings)}</span>
            </div>  
            <p>${r.message}</p>
          </a>
        </li>
        `;
      }).join('');
      this.$messagesReceived.innerHTML = tempStr;
    },

    async fetchSentMessages (userId) {
      this.messagesSent = await this.tinderApi.getSentMessagesFromUser(userId);
      this.updateSentMessages();   

      const messageId = this.messagesSent[0].receiverId;
      this.setActiveSentMessage(messageId);  
    },
    setActiveSentMessage (messageId) {
      this.currentMessage = messageId; 
      const $selectedMessage = this.$messagesSent.querySelector(`.messages__sent__list-item.selected`);
      if ($selectedMessage !== null) {
        $selectedMessage.classList.remove('selected')
      }
      this.$messagesSent.querySelector(`.messages__sent__list-item > a[data-id="${messageId}"]`).parentNode.classList.add('selected');

      document.querySelector('.messages__sent .amount').innerHTML = `<span>${this.messagesSent.length}</span>`
      this.fetchConversationBetweenUsers();
    },
    updateSentMessages () {
      const dateStettings = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute : 'numeric', second: 'numeric'
      };

      let tempStr = '';
      tempStr = this.messagesSent.map((s) => {
        return `
        <li class="messages__sent__list-item">
          <a href="#" data-id=${s.receiverId}>
            <div class="container__messages__name-and-date">
              <span class="messages__sent__name messages__sent__name--sent">${this.users.find(u => u.id === s.receiverId).firstName} ${this.users.find(u => u.id === s.receiverId).lastName}</span>
              <span class="date__message">${new Date(s.createdAt).toLocaleDateString('nl-BE', dateStettings)}</span>
            </div>
            <p>${s.message}</p>
          </a>
        </li>
        `;
      }).join('');
      this.$messagesSent.innerHTML = tempStr;      
      },

    async fetchConversationBetweenUsers () {
      this.conversation = await this.tinderApi.getConversationBetweenUsers(this.currentUserId, this.currentMessage);
      this.updateConversationBetweenUsers();     
    },
    updateConversationBetweenUsers () {
      const dateStettings = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute : 'numeric', second: 'numeric'};

      let tempStr = '';
      tempStr = this.conversation.map((c) => {
        return `
        <li data-id="${c.id}" class="${c.receiverId === this.currentUserId ? 'conversation__message__received' : 'conversation__message__sent'}">
          <p class="message__convo">${c.message}</p>
          <span class="date__message date__message--conversation">${new Date(c.createdAt).toLocaleDateString('nl-BE', dateStettings)}</span>
        </li>
        `;
      }).join('');
      this.$conversationList.innerHTML = tempStr; 

      const conversationPerson = this.users.find(u => { return u. id === this.currentMessage});

      let str = `
        <img src="${conversationPerson.picture.thumbnail}">
        <p>${conversationPerson.firstName} ${conversationPerson.lastName}</p>
      `;
      this.$conversationImageAndUser.innerHTML = str;
    },

    async fetchMatchesForUser (userId) {
      this.matchesForUser = await this.tinderApi.getMatchesForUser(userId);
      this.updateNoMatchesUi()
      this.updateMatchesUi();
      this.listenersMatches();
    },
    updateNoMatchesUi () {
      let arrayNoMatches = [];
      this.users.map(u => {
        const containsMatches = this.matchesForUser.some(mu => {
          return mu.userId === u.id || mu.friendId === u.id;
        });
        if (containsMatches === false) {
          arrayNoMatches.push(u.id);
        }
      });

      document.querySelector('.amount--no-matches').innerHTML = `<span>${arrayNoMatches.length}</span>`;

      let tempStrForNoMatch = '';
      tempStrForNoMatch = arrayNoMatches.map(anm => {
      
        return ` 
          <li class="matches__list-item">
            <div class="flex__image-and-info">
              <div>
                <img src="${this.users.find(user => user.id === anm).picture.thumbnail}">
              </div>

              <div>
                <p><strong>${this.users.find(user => user.id === anm).firstName} ${this.users.find(user => user.id === anm).lastName}</strong></p>
                <div class="flex__age-and-gender">
                  <p class="age">${Math.floor((new Date - new Date(this.users.find(user => user.id === anm).dayOfBirth)) / (34 * 3600 * 365.25 * 1000))}</p>
                  <p>${this.users.find(user => user.id === anm).gender}</p>                
                </div>
                <p>${this.users.find(user => user.id === anm).location.city}</p>
                <p>${this.users.find(user => user.id === anm).location.country}</p>
              </div>
            </div> 
            
            <ul class="flex-svg">
              <li class="button__rating" data-rating="dislike" data-id="${anm}"><svg class="flex-svg--X" height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m256 512c-141.160156 0-256-114.839844-256-256s114.839844-256 256-256 256 114.839844 256 256-114.839844 256-256 256zm0-475.429688c-120.992188 0-219.429688 98.4375-219.429688 219.429688s98.4375 219.429688 219.429688 219.429688 219.429688-98.4375 219.429688-219.429688-98.4375-219.429688-219.429688-219.429688zm0 0"/><path d="m347.429688 365.714844c-4.679688 0-9.359376-1.785156-12.929688-5.359375l-182.855469-182.855469c-7.144531-7.144531-7.144531-18.714844 0-25.855469 7.140625-7.140625 18.714844-7.144531 25.855469 0l182.855469 182.855469c7.144531 7.144531 7.144531 18.714844 0 25.855469-3.570313 3.574219-8.246094 5.359375-12.925781 5.359375zm0 0"/><path d="m164.570312 365.714844c-4.679687 0-9.355468-1.785156-12.925781-5.359375-7.144531-7.140625-7.144531-18.714844 0-25.855469l182.855469-182.855469c7.144531-7.144531 18.714844-7.144531 25.855469 0 7.140625 7.140625 7.144531 18.714844 0 25.855469l-182.855469 182.855469c-3.570312 3.574219-8.25 5.359375-12.929688 5.359375zm0 0"/></svg></li>
              <li class="button__rating" data-rating="like" data-id="${anm}"><svg class="flex-svg--heart" viewBox="0 -28 512.001 512" xmlns="http://www.w3.org/2000/svg"><path d="m256 455.515625c-7.289062 0-14.316406-2.640625-19.792969-7.4375-20.683593-18.085937-40.625-35.082031-58.21875-50.074219l-.089843-.078125c-51.582032-43.957031-96.125-81.917969-127.117188-119.3125-34.644531-41.804687-50.78125-81.441406-50.78125-124.742187 0-42.070313 14.425781-80.882813 40.617188-109.292969 26.503906-28.746094 62.871093-44.578125 102.414062-44.578125 29.554688 0 56.621094 9.34375 80.445312 27.769531 12.023438 9.300781 22.921876 20.683594 32.523438 33.960938 9.605469-13.277344 20.5-24.660157 32.527344-33.960938 23.824218-18.425781 50.890625-27.769531 80.445312-27.769531 39.539063 0 75.910156 15.832031 102.414063 44.578125 26.191406 28.410156 40.613281 67.222656 40.613281 109.292969 0 43.300781-16.132812 82.9375-50.777344 124.738281-30.992187 37.398437-75.53125 75.355469-127.105468 119.308594-17.625 15.015625-37.597657 32.039062-58.328126 50.167969-5.472656 4.789062-12.503906 7.429687-19.789062 7.429687zm-112.96875-425.523437c-31.066406 0-59.605469 12.398437-80.367188 34.914062-21.070312 22.855469-32.675781 54.449219-32.675781 88.964844 0 36.417968 13.535157 68.988281 43.882813 105.605468 29.332031 35.394532 72.960937 72.574219 123.476562 115.625l.09375.078126c17.660156 15.050781 37.679688 32.113281 58.515625 50.332031 20.960938-18.253907 41.011719-35.34375 58.707031-50.417969 50.511719-43.050781 94.136719-80.222656 123.46875-115.617188 30.34375-36.617187 43.878907-69.1875 43.878907-105.605468 0-34.515625-11.605469-66.109375-32.675781-88.964844-20.757813-22.515625-49.300782-34.914062-80.363282-34.914062-22.757812 0-43.652344 7.234374-62.101562 21.5-16.441406 12.71875-27.894532 28.796874-34.609375 40.046874-3.453125 5.785157-9.53125 9.238282-16.261719 9.238282s-12.808594-3.453125-16.261719-9.238282c-6.710937-11.25-18.164062-27.328124-34.609375-40.046874-18.449218-14.265626-39.34375-21.5-62.097656-21.5zm0 0"/></svg></li>
              <li class="button__rating" data-rating="superlike" data-id="${anm}"><svg class="flex-svg--star" height="511pt" viewBox="0 -10 511.98685 511" width="511pt" xmlns="http://www.w3.org/2000/svg"><path d="m114.59375 491.140625c-5.609375 0-11.179688-1.75-15.933594-5.1875-8.855468-6.417969-12.992187-17.449219-10.582031-28.09375l32.9375-145.089844-111.703125-97.960937c-8.210938-7.167969-11.347656-18.519532-7.976562-28.90625 3.371093-10.367188 12.542968-17.707032 23.402343-18.710938l147.796875-13.417968 58.433594-136.746094c4.308594-10.046875 14.121094-16.535156 25.023438-16.535156 10.902343 0 20.714843 6.488281 25.023437 16.511718l58.433594 136.769532 147.773437 13.417968c10.882813.980469 20.054688 8.34375 23.425782 18.710938 3.371093 10.367187.253906 21.738281-7.957032 28.90625l-111.703125 97.941406 32.9375 145.085938c2.414063 10.667968-1.726562 21.699218-10.578125 28.097656-8.832031 6.398437-20.609375 6.890625-29.910156 1.300781l-127.445312-76.160156-127.445313 76.203125c-4.308594 2.558594-9.109375 3.863281-13.953125 3.863281zm141.398438-112.875c4.84375 0 9.640624 1.300781 13.953124 3.859375l120.277344 71.9375-31.085937-136.941406c-2.21875-9.746094 1.089843-19.921875 8.621093-26.515625l105.472657-92.5-139.542969-12.671875c-10.046875-.917969-18.6875-7.234375-22.613281-16.492188l-55.082031-129.046875-55.148438 129.066407c-3.882812 9.195312-12.523438 15.511718-22.546875 16.429687l-139.5625 12.671875 105.46875 92.5c7.554687 6.613281 10.859375 16.769531 8.621094 26.539062l-31.0625 136.9375 120.277343-71.914062c4.308594-2.558594 9.109376-3.859375 13.953126-3.859375zm-84.585938-221.847656s0 .023437-.023438.042969zm169.128906-.0625.023438.042969c0-.023438 0-.023438-.023438-.042969zm0 0"/></svg></li>
            </ul>
            
          </li>
        `; 
      }).join('');
      this.$matchMakerNoMatchList.innerHTML = tempStrForNoMatch;
     
    },
    updateMatchesUi () {
      let tempStr = this.users.map(u => {
        const gottenRating = this.matchesForUser.find(m => m.userId === u.id && this.currentUserId !== u.id);
        const givenRating = this.matchesForUser.find(m => m.friendId === u.id && this.currentUserId !== u.id);

        if (gottenRating !== undefined || givenRating !== undefined) {
          return `
            <li class="matches__list-item">
              <div class="flex__image-and-info">
                <div>
                  <img src="${u.picture.thumbnail}">
                </div>

                <div class="container--info--match">
                  <p><strong>${u.firstName} ${u.lastName}</strong></p>
                  <div class="flex__age-and-gender">
                    <p class="age">${Math.floor((new Date - new Date(u.dayOfBirth)) / (34 * 3600 * 365.25 * 1000))}</p>
                    <p>${u.gender}</p>                
                  </div>
                  <p>${u.location.city}</p>
                  <p>${u.location.country}</p>
                </div>

                <div class="response--question">
                  <div class="svg--question--mark">${gottenRating === undefined ? this.svgNoRatingYet() : ''}</div>             
                </div>
              </div> 

              <div class="response--like">
                  <div class="svg--question--mark">${gottenRating !== undefined ? this.svggottenRating(gottenRating) : ''}</div>             
              </div>
              
              <ul class="flex-svg">
                ${givenRating !== undefined ? this.svgGivenRating(u.id, givenRating) : this.svgGivenRating(u.id)}
              </ul>
            
            </li>
          `;
        } else {
          return '';
        }
      }).join('');

      this.$matchMakerMatchList.innerHTML = tempStr;

      document.querySelector('.amount--matches').innerHTML = `<span>${this.matchesForUser.length}</span>`;
    },
    svgNoRatingYet () {
        return `
          <svg class="response--svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M452 0H60C26.916 0 0 26.916 0 60v80h40V60c0-11.028 8.972-20 20-20h392c11.028 0 20 8.972 20 20v392c0 11.028-8.972 20-20 20H60c-11.028 0-20-8.972-20-20v-80H0v80c0 33.084 26.916 60 60 60h392c33.084 0 60-26.916 60-60V60c0-33.084-26.916-60-60-60z"/><path d="M240 131.716L211.716 160l76 76H0v40h287.716l-76 76L240 380.284 364.284 256z"/></svg>
          <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><circle cx="256" cy="452" r="60"/><path d="m256 0c-86.019 0-156 69.981-156 156v15h120v-15c0-19.851 16.149-36 36-36s36 16.149 36 36c0 10.578-4.643 20.59-12.74 27.471l-83.26 70.787v107.742h120v-52.258l40.976-34.837c34.968-29.714 55.024-73.052 55.024-118.905 0-86.019-69.981-156-156-156z"/></g></svg>
        `;
    },
    svggottenRating (gottenRating) {
      if (gottenRating.rating === 'like') {
        return `
          <svg class="response--svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M452 0H60C26.916 0 0 26.916 0 60v80h40V60c0-11.028 8.972-20 20-20h392c11.028 0 20 8.972 20 20v392c0 11.028-8.972 20-20 20H60c-11.028 0-20-8.972-20-20v-80H0v80c0 33.084 26.916 60 60 60h392c33.084 0 60-26.916 60-60V60c0-33.084-26.916-60-60-60z"/><path d="M240 131.716L211.716 160l76 76H0v40h287.716l-76 76L240 380.284 364.284 256z"/></svg>
          <svg class="response--svg--like" viewBox="0 -28 512.001 512" xmlns="http://www.w3.org/2000/svg"><path d="m256 455.515625c-7.289062 0-14.316406-2.640625-19.792969-7.4375-20.683593-18.085937-40.625-35.082031-58.21875-50.074219l-.089843-.078125c-51.582032-43.957031-96.125-81.917969-127.117188-119.3125-34.644531-41.804687-50.78125-81.441406-50.78125-124.742187 0-42.070313 14.425781-80.882813 40.617188-109.292969 26.503906-28.746094 62.871093-44.578125 102.414062-44.578125 29.554688 0 56.621094 9.34375 80.445312 27.769531 12.023438 9.300781 22.921876 20.683594 32.523438 33.960938 9.605469-13.277344 20.5-24.660157 32.527344-33.960938 23.824218-18.425781 50.890625-27.769531 80.445312-27.769531 39.539063 0 75.910156 15.832031 102.414063 44.578125 26.191406 28.410156 40.613281 67.222656 40.613281 109.292969 0 43.300781-16.132812 82.9375-50.777344 124.738281-30.992187 37.398437-75.53125 75.355469-127.105468 119.308594-17.625 15.015625-37.597657 32.039062-58.328126 50.167969-5.472656 4.789062-12.503906 7.429687-19.789062 7.429687zm-112.96875-425.523437c-31.066406 0-59.605469 12.398437-80.367188 34.914062-21.070312 22.855469-32.675781 54.449219-32.675781 88.964844 0 36.417968 13.535157 68.988281 43.882813 105.605468 29.332031 35.394532 72.960937 72.574219 123.476562 115.625l.09375.078126c17.660156 15.050781 37.679688 32.113281 58.515625 50.332031 20.960938-18.253907 41.011719-35.34375 58.707031-50.417969 50.511719-43.050781 94.136719-80.222656 123.46875-115.617188 30.34375-36.617187 43.878907-69.1875 43.878907-105.605468 0-34.515625-11.605469-66.109375-32.675781-88.964844-20.757813-22.515625-49.300782-34.914062-80.363282-34.914062-22.757812 0-43.652344 7.234374-62.101562 21.5-16.441406 12.71875-27.894532 28.796874-34.609375 40.046874-3.453125 5.785157-9.53125 9.238282-16.261719 9.238282s-12.808594-3.453125-16.261719-9.238282c-6.710937-11.25-18.164062-27.328124-34.609375-40.046874-18.449218-14.265626-39.34375-21.5-62.097656-21.5zm0 0"/></svg>
        `;
      } else if (gottenRating.rating === 'dislike') {
        return `
          <svg class="response--svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M452 0H60C26.916 0 0 26.916 0 60v80h40V60c0-11.028 8.972-20 20-20h392c11.028 0 20 8.972 20 20v392c0 11.028-8.972 20-20 20H60c-11.028 0-20-8.972-20-20v-80H0v80c0 33.084 26.916 60 60 60h392c33.084 0 60-26.916 60-60V60c0-33.084-26.916-60-60-60z"/><path d="M240 131.716L211.716 160l76 76H0v40h287.716l-76 76L240 380.284 364.284 256z"/></svg>
          <svg class="response--svg--dislike" height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m256 512c-141.160156 0-256-114.839844-256-256s114.839844-256 256-256 256 114.839844 256 256-114.839844 256-256 256zm0-475.429688c-120.992188 0-219.429688 98.4375-219.429688 219.429688s98.4375 219.429688 219.429688 219.429688 219.429688-98.4375 219.429688-219.429688-98.4375-219.429688-219.429688-219.429688zm0 0"/><path d="m347.429688 365.714844c-4.679688 0-9.359376-1.785156-12.929688-5.359375l-182.855469-182.855469c-7.144531-7.144531-7.144531-18.714844 0-25.855469 7.140625-7.140625 18.714844-7.144531 25.855469 0l182.855469 182.855469c7.144531 7.144531 7.144531 18.714844 0 25.855469-3.570313 3.574219-8.246094 5.359375-12.925781 5.359375zm0 0"/><path d="m164.570312 365.714844c-4.679687 0-9.355468-1.785156-12.925781-5.359375-7.144531-7.140625-7.144531-18.714844 0-25.855469l182.855469-182.855469c7.144531-7.144531 18.714844-7.144531 25.855469 0 7.140625 7.140625 7.144531 18.714844 0 25.855469l-182.855469 182.855469c-3.570312 3.574219-8.25 5.359375-12.929688 5.359375zm0 0"/></>
        `;
      } else if (gottenRating.rating === 'superlike') {
        return `
          <svg class="response--svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M452 0H60C26.916 0 0 26.916 0 60v80h40V60c0-11.028 8.972-20 20-20h392c11.028 0 20 8.972 20 20v392c0 11.028-8.972 20-20 20H60c-11.028 0-20-8.972-20-20v-80H0v80c0 33.084 26.916 60 60 60h392c33.084 0 60-26.916 60-60V60c0-33.084-26.916-60-60-60z"/><path d="M240 131.716L211.716 160l76 76H0v40h287.716l-76 76L240 380.284 364.284 256z"/></svg>
          <svg class="response--svg--star" height="511pt" viewBox="0 -10 511.98685 511" width="511pt" xmlns="http://www.w3.org/2000/svg"><path d="m114.59375 491.140625c-5.609375 0-11.179688-1.75-15.933594-5.1875-8.855468-6.417969-12.992187-17.449219-10.582031-28.09375l32.9375-145.089844-111.703125-97.960937c-8.210938-7.167969-11.347656-18.519532-7.976562-28.90625 3.371093-10.367188 12.542968-17.707032 23.402343-18.710938l147.796875-13.417968 58.433594-136.746094c4.308594-10.046875 14.121094-16.535156 25.023438-16.535156 10.902343 0 20.714843 6.488281 25.023437 16.511718l58.433594 136.769532 147.773437 13.417968c10.882813.980469 20.054688 8.34375 23.425782 18.710938 3.371093 10.367187.253906 21.738281-7.957032 28.90625l-111.703125 97.941406 32.9375 145.085938c2.414063 10.667968-1.726562 21.699218-10.578125 28.097656-8.832031 6.398437-20.609375 6.890625-29.910156 1.300781l-127.445312-76.160156-127.445313 76.203125c-4.308594 2.558594-9.109375 3.863281-13.953125 3.863281zm141.398438-112.875c4.84375 0 9.640624 1.300781 13.953124 3.859375l120.277344 71.9375-31.085937-136.941406c-2.21875-9.746094 1.089843-19.921875 8.621093-26.515625l105.472657-92.5-139.542969-12.671875c-10.046875-.917969-18.6875-7.234375-22.613281-16.492188l-55.082031-129.046875-55.148438 129.066407c-3.882812 9.195312-12.523438 15.511718-22.546875 16.429687l-139.5625 12.671875 105.46875 92.5c7.554687 6.613281 10.859375 16.769531 8.621094 26.539062l-31.0625 136.9375 120.277343-71.914062c4.308594-2.558594 9.109376-3.859375 13.953126-3.859375zm-84.585938-221.847656s0 .023437-.023438.042969zm169.128906-.0625.023438.042969c0-.023438 0-.023438-.023438-.042969zm0 0"/></svg>
        `;
      }
    },
    svgGivenRating (id, givenRating) {
      if (givenRating !== undefined) {
        if (givenRating.friendId === id) {
          return `
          <li><button class="button__svg"><svg class="flex-svg--X ${givenRating.rating === 'dislike' ? 'opacity__full' : ''}" height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m256 512c-141.160156 0-256-114.839844-256-256s114.839844-256 256-256 256 114.839844 256 256-114.839844 256-256 256zm0-475.429688c-120.992188 0-219.429688 98.4375-219.429688 219.429688s98.4375 219.429688 219.429688 219.429688 219.429688-98.4375 219.429688-219.429688-98.4375-219.429688-219.429688-219.429688zm0 0"/><path d="m347.429688 365.714844c-4.679688 0-9.359376-1.785156-12.929688-5.359375l-182.855469-182.855469c-7.144531-7.144531-7.144531-18.714844 0-25.855469 7.140625-7.140625 18.714844-7.144531 25.855469 0l182.855469 182.855469c7.144531 7.144531 7.144531 18.714844 0 25.855469-3.570313 3.574219-8.246094 5.359375-12.925781 5.359375zm0 0"/><path d="m164.570312 365.714844c-4.679687 0-9.355468-1.785156-12.925781-5.359375-7.144531-7.140625-7.144531-18.714844 0-25.855469l182.855469-182.855469c7.144531-7.144531 18.714844-7.144531 25.855469 0 7.140625 7.140625 7.144531 18.714844 0 25.855469l-182.855469 182.855469c-3.570312 3.574219-8.25 5.359375-12.929688 5.359375zm0 0"/></svg></button></li>
          <li><button class="button__svg"><svg class="flex-svg--heart ${givenRating.rating === 'like' ? 'opacity__full' : ''}" viewBox="0 -28 512.001 512" xmlns="http://www.w3.org/2000/svg"><path d="m256 455.515625c-7.289062 0-14.316406-2.640625-19.792969-7.4375-20.683593-18.085937-40.625-35.082031-58.21875-50.074219l-.089843-.078125c-51.582032-43.957031-96.125-81.917969-127.117188-119.3125-34.644531-41.804687-50.78125-81.441406-50.78125-124.742187 0-42.070313 14.425781-80.882813 40.617188-109.292969 26.503906-28.746094 62.871093-44.578125 102.414062-44.578125 29.554688 0 56.621094 9.34375 80.445312 27.769531 12.023438 9.300781 22.921876 20.683594 32.523438 33.960938 9.605469-13.277344 20.5-24.660157 32.527344-33.960938 23.824218-18.425781 50.890625-27.769531 80.445312-27.769531 39.539063 0 75.910156 15.832031 102.414063 44.578125 26.191406 28.410156 40.613281 67.222656 40.613281 109.292969 0 43.300781-16.132812 82.9375-50.777344 124.738281-30.992187 37.398437-75.53125 75.355469-127.105468 119.308594-17.625 15.015625-37.597657 32.039062-58.328126 50.167969-5.472656 4.789062-12.503906 7.429687-19.789062 7.429687zm-112.96875-425.523437c-31.066406 0-59.605469 12.398437-80.367188 34.914062-21.070312 22.855469-32.675781 54.449219-32.675781 88.964844 0 36.417968 13.535157 68.988281 43.882813 105.605468 29.332031 35.394532 72.960937 72.574219 123.476562 115.625l.09375.078126c17.660156 15.050781 37.679688 32.113281 58.515625 50.332031 20.960938-18.253907 41.011719-35.34375 58.707031-50.417969 50.511719-43.050781 94.136719-80.222656 123.46875-115.617188 30.34375-36.617187 43.878907-69.1875 43.878907-105.605468 0-34.515625-11.605469-66.109375-32.675781-88.964844-20.757813-22.515625-49.300782-34.914062-80.363282-34.914062-22.757812 0-43.652344 7.234374-62.101562 21.5-16.441406 12.71875-27.894532 28.796874-34.609375 40.046874-3.453125 5.785157-9.53125 9.238282-16.261719 9.238282s-12.808594-3.453125-16.261719-9.238282c-6.710937-11.25-18.164062-27.328124-34.609375-40.046874-18.449218-14.265626-39.34375-21.5-62.097656-21.5zm0 0"/></svg></button></li>
          <li><button class="button__svg"><svg class="flex-svg--star ${givenRating.rating === 'superlike' ? 'opacity__full' : ''}" height="511pt" viewBox="0 -10 511.98685 511" width="511pt" xmlns="http://www.w3.org/2000/svg"><path d="m114.59375 491.140625c-5.609375 0-11.179688-1.75-15.933594-5.1875-8.855468-6.417969-12.992187-17.449219-10.582031-28.09375l32.9375-145.089844-111.703125-97.960937c-8.210938-7.167969-11.347656-18.519532-7.976562-28.90625 3.371093-10.367188 12.542968-17.707032 23.402343-18.710938l147.796875-13.417968 58.433594-136.746094c4.308594-10.046875 14.121094-16.535156 25.023438-16.535156 10.902343 0 20.714843 6.488281 25.023437 16.511718l58.433594 136.769532 147.773437 13.417968c10.882813.980469 20.054688 8.34375 23.425782 18.710938 3.371093 10.367187.253906 21.738281-7.957032 28.90625l-111.703125 97.941406 32.9375 145.085938c2.414063 10.667968-1.726562 21.699218-10.578125 28.097656-8.832031 6.398437-20.609375 6.890625-29.910156 1.300781l-127.445312-76.160156-127.445313 76.203125c-4.308594 2.558594-9.109375 3.863281-13.953125 3.863281zm141.398438-112.875c4.84375 0 9.640624 1.300781 13.953124 3.859375l120.277344 71.9375-31.085937-136.941406c-2.21875-9.746094 1.089843-19.921875 8.621093-26.515625l105.472657-92.5-139.542969-12.671875c-10.046875-.917969-18.6875-7.234375-22.613281-16.492188l-55.082031-129.046875-55.148438 129.066407c-3.882812 9.195312-12.523438 15.511718-22.546875 16.429687l-139.5625 12.671875 105.46875 92.5c7.554687 6.613281 10.859375 16.769531 8.621094 26.539062l-31.0625 136.9375 120.277343-71.914062c4.308594-2.558594 9.109376-3.859375 13.953126-3.859375zm-84.585938-221.847656s0 .023437-.023438.042969zm169.128906-.0625.023438.042969c0-.023438 0-.023438-.023438-.042969zm0 0"/></button></svg></li>
        `;
        } 
      } else if (givenRating === undefined) {
        return `
          <li><button class="button__svg"><svg class="flex-svg--X" height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m256 512c-141.160156 0-256-114.839844-256-256s114.839844-256 256-256 256 114.839844 256 256-114.839844 256-256 256zm0-475.429688c-120.992188 0-219.429688 98.4375-219.429688 219.429688s98.4375 219.429688 219.429688 219.429688 219.429688-98.4375 219.429688-219.429688-98.4375-219.429688-219.429688-219.429688zm0 0"/><path d="m347.429688 365.714844c-4.679688 0-9.359376-1.785156-12.929688-5.359375l-182.855469-182.855469c-7.144531-7.144531-7.144531-18.714844 0-25.855469 7.140625-7.140625 18.714844-7.144531 25.855469 0l182.855469 182.855469c7.144531 7.144531 7.144531 18.714844 0 25.855469-3.570313 3.574219-8.246094 5.359375-12.925781 5.359375zm0 0"/><path d="m164.570312 365.714844c-4.679687 0-9.355468-1.785156-12.925781-5.359375-7.144531-7.140625-7.144531-18.714844 0-25.855469l182.855469-182.855469c7.144531-7.144531 18.714844-7.144531 25.855469 0 7.140625 7.140625 7.144531 18.714844 0 25.855469l-182.855469 182.855469c-3.570312 3.574219-8.25 5.359375-12.929688 5.359375zm0 0"/></svg></button></li>
          <li><button class="button__svg"><svg class="flex-svg--heart" viewBox="0 -28 512.001 512" xmlns="http://www.w3.org/2000/svg"><path d="m256 455.515625c-7.289062 0-14.316406-2.640625-19.792969-7.4375-20.683593-18.085937-40.625-35.082031-58.21875-50.074219l-.089843-.078125c-51.582032-43.957031-96.125-81.917969-127.117188-119.3125-34.644531-41.804687-50.78125-81.441406-50.78125-124.742187 0-42.070313 14.425781-80.882813 40.617188-109.292969 26.503906-28.746094 62.871093-44.578125 102.414062-44.578125 29.554688 0 56.621094 9.34375 80.445312 27.769531 12.023438 9.300781 22.921876 20.683594 32.523438 33.960938 9.605469-13.277344 20.5-24.660157 32.527344-33.960938 23.824218-18.425781 50.890625-27.769531 80.445312-27.769531 39.539063 0 75.910156 15.832031 102.414063 44.578125 26.191406 28.410156 40.613281 67.222656 40.613281 109.292969 0 43.300781-16.132812 82.9375-50.777344 124.738281-30.992187 37.398437-75.53125 75.355469-127.105468 119.308594-17.625 15.015625-37.597657 32.039062-58.328126 50.167969-5.472656 4.789062-12.503906 7.429687-19.789062 7.429687zm-112.96875-425.523437c-31.066406 0-59.605469 12.398437-80.367188 34.914062-21.070312 22.855469-32.675781 54.449219-32.675781 88.964844 0 36.417968 13.535157 68.988281 43.882813 105.605468 29.332031 35.394532 72.960937 72.574219 123.476562 115.625l.09375.078126c17.660156 15.050781 37.679688 32.113281 58.515625 50.332031 20.960938-18.253907 41.011719-35.34375 58.707031-50.417969 50.511719-43.050781 94.136719-80.222656 123.46875-115.617188 30.34375-36.617187 43.878907-69.1875 43.878907-105.605468 0-34.515625-11.605469-66.109375-32.675781-88.964844-20.757813-22.515625-49.300782-34.914062-80.363282-34.914062-22.757812 0-43.652344 7.234374-62.101562 21.5-16.441406 12.71875-27.894532 28.796874-34.609375 40.046874-3.453125 5.785157-9.53125 9.238282-16.261719 9.238282s-12.808594-3.453125-16.261719-9.238282c-6.710937-11.25-18.164062-27.328124-34.609375-40.046874-18.449218-14.265626-39.34375-21.5-62.097656-21.5zm0 0"/></svg></button></li>
          <li><button class="button__svg"><svg class="flex-svg--star" height="511pt" viewBox="0 -10 511.98685 511" width="511pt" xmlns="http://www.w3.org/2000/svg"><path d="m114.59375 491.140625c-5.609375 0-11.179688-1.75-15.933594-5.1875-8.855468-6.417969-12.992187-17.449219-10.582031-28.09375l32.9375-145.089844-111.703125-97.960937c-8.210938-7.167969-11.347656-18.519532-7.976562-28.90625 3.371093-10.367188 12.542968-17.707032 23.402343-18.710938l147.796875-13.417968 58.433594-136.746094c4.308594-10.046875 14.121094-16.535156 25.023438-16.535156 10.902343 0 20.714843 6.488281 25.023437 16.511718l58.433594 136.769532 147.773437 13.417968c10.882813.980469 20.054688 8.34375 23.425782 18.710938 3.371093 10.367187.253906 21.738281-7.957032 28.90625l-111.703125 97.941406 32.9375 145.085938c2.414063 10.667968-1.726562 21.699218-10.578125 28.097656-8.832031 6.398437-20.609375 6.890625-29.910156 1.300781l-127.445312-76.160156-127.445313 76.203125c-4.308594 2.558594-9.109375 3.863281-13.953125 3.863281zm141.398438-112.875c4.84375 0 9.640624 1.300781 13.953124 3.859375l120.277344 71.9375-31.085937-136.941406c-2.21875-9.746094 1.089843-19.921875 8.621093-26.515625l105.472657-92.5-139.542969-12.671875c-10.046875-.917969-18.6875-7.234375-22.613281-16.492188l-55.082031-129.046875-55.148438 129.066407c-3.882812 9.195312-12.523438 15.511718-22.546875 16.429687l-139.5625 12.671875 105.46875 92.5c7.554687 6.613281 10.859375 16.769531 8.621094 26.539062l-31.0625 136.9375 120.277343-71.914062c4.308594-2.558594 9.109376-3.859375 13.953126-3.859375zm-84.585938-221.847656s0 .023437-.023438.042969zm169.128906-.0625.023438.042969c0-.023438 0-.023438-.023438-.042969zm0 0"/></svg></button></li>
        `; 
      }    
    },
    listenersMatches () {
      this.$buttonRating = document.querySelectorAll('.button__rating').forEach(btn => {
        btn.addEventListener('click', async event => {
          const matchToCreate = {
            friendId: event.target.dataset.id || event.target.parentNode.dataset.id || event.target.parentNode.parentNode.dataset.id,
            rating: event.target.dataset.rating || event.target.parentNode.dataset.rating || event.target.parentNode.parentNode.dataset.rating,
            userId: this.currentUserId,
          }

          await this.tinderApi.addMatch(matchToCreate);
          this.fetchMatchesForUser(this.currentUserId);

        })
      })
    }
    
   
  }

  app.initialize();
})();

