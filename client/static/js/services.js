const TINDER_BASE_PATH = 'http://localhost:8080/api';

function TinderApi () {
  this.getUsers = async () => { 
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users`);
      const data = await response.json();

      return data;
    } catch (error) {
      console.log('Something went wrong!', error);
    }  
  };

  this.getReceivedMessagesFromUser = async (userId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/messages?type=received`);
      const data = await response.json();

      return data;
    } catch (error) {
      console.log('Something went wrong!', error);
    }
  };

  this.getSentMessagesFromUser = async (userId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/messages?type=sent`);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.log('Something went wrong!', error);
    }
  };

  this.getConversationBetweenUsers = async (userId, friendId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/messages?type=conversation&friendId=${friendId}`);
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.log('Something went wrong!', error);
    }
  };

  this.addMessageBetweenUsers = async (message) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/messages`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message),
      });
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.log('Something went wrong!', error);
    }
  };

  this.getMatchesForUser = async (userId) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/users/${userId}/matches`);
      const data = await response.json();

      return data;
    } catch (error) {
      console.log('Something went wrong!', error);
    }
  };

  this.addMatch = async (rating) => {
    try {
      const response = await fetch(`${TINDER_BASE_PATH}/matches`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rating),
      });
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.log('Something went wrong!', error);
    }
  };
}