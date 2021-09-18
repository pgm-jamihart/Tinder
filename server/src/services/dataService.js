/*
Import packages
*/
const { match } = require('assert');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/*
Import custom packages
*/
const { HTTPError, convertArrayToPagedObject } = require('../utils');

/*
File paths
*/
const filePathMessages = path.join(__dirname, '..', 'data', 'messages.json');
const filePathMatches = path.join(__dirname, '..', 'data', 'matches.json');
const filePathUsers = path.join(__dirname, '..', 'data', 'users.json');

/*
Write your methods from here
*/

/*
Read messages.json
*/
const readDataFromMessagesFile = () => {
  const data = fs.readFileSync(filePathMessages, { encoding: 'utf-8', flag: 'r'});
  const messages = JSON.parse(data);

  return messages;
};

const readDataFromUsersFile = () => {
  const data = fs.readFileSync(filePathUsers, { encoding: 'utf-8', flag: 'r'});
  const users = JSON.parse(data);

  return users;
};

const readDataFromMatchesFile = () => {
  const data = fs.readFileSync(filePathMatches, { encoding: 'utf-8', flag: 'r'});
  const matches = JSON.parse(data);

  return matches;
};

/*
Get all users
*/
const getUsers = () => {
  try {
    const users = readDataFromUsersFile();
    // hier tussen kan er onder andere gesorteerd worden.
    return users;
  } catch (error) {
    throw new HTTPError('Can\'t get users!', 500);
  }
};

/*
Get user by id 
*/
const getUserById = (userId) => {
  try {
    const users = readDataFromUsersFile();
    // hier tussen kan er onder andere gesorteerd worden.
    const user = users.find(u => u.id === userId);

    if (!user) {
      throw new HTTPError(`Can't find the user from users with id ${userId}`, 404);
    }

    return user;
  } catch (error) {
    throw new HTTPError('Can\'t get users!', 500);
  }
};

/*
Create User
*/
const createUser = (user) => {
  try {
    // Get al users
    const users = readDataFromUsersFile();
    // Create a message
    const userToCreate = {
      ...user,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    users.push(userToCreate);
    // Write message array to the users.json file
    fs.writeFileSync(filePathUsers, JSON.stringify(users, null, 2));
    // Return the created user
    return userToCreate;
  } catch (error) {
    throw new HTTPError('Can\'t create a new message', 501);
  }
};

/*
Update a specific user
*/
const updateUser = (id, user) => {
  try {
    const userToUpdate = {
      ...user,
    };
    userToUpdate.modifiedAt = Date.now();

    // Read the users.json file
    const users = readDataFromUsersFile();
    // Find the index of the user we want to remove
    const findIndex = users.findIndex((article) => article.id === id);
    if (findIndex === -1) {
      throw new HTTPError(`Cant't find the post with id ${id}!`, 404);
    }
    users[findIndex] = {
      ...users[findIndex],
      ...userToUpdate,
    };
    // Write users array to the news.json file
    fs.writeFileSync(filePathUsers, JSON.stringify(users, null, 2));
    // Send response
    return users[findIndex];
  } catch (error) {
    throw error;
  }
};

/*
Delete a specific user
*/
const deleteUser = (id) => {
  try {
    // Read the users.json file
    const users = readDataFromUsersFile();
    // Find the index of the post we want to remove
    const findIndex = users.findIndex((user) => user.id === id);
    if (findIndex === -1) {
      throw new HTTPError(`Cant't find the user with id ${id}!`, 404);
    }
    users.splice(findIndex, 1);
    // Write users array to the news.json file
    fs.writeFileSync(filePathUsers, JSON.stringify(users, null, 2));
    // Send response
    return {
      message: `Successful deleted the users with id ${id}!`,
    };
  } catch (error) {
    throw error;
  }
};

/*
Get all messages
*/
const getMessages = () => {
  try {
    const messages = readDataFromMessagesFile();
    // hier tussen kan er onder andere gesorteerd worden.
    return messages;
  } catch (error) {
    throw new HTTPError('Can\'t get matches!', 500);
  }
};

/*
Get message by id 
*/
const getMessageById = (messageId) => {
  try {
    const messages = readDataFromMessagesFile();
    // hier tussen kan er onder andere gesorteerd worden.
    const message = messages.find(m => m.id === messageId);

    if (!message) {
      throw new HTTPError(`Can't find the message from messages with id ${messageId}`, 404);
    }

    return message;
  } catch (error) {
    throw new HTTPError('Can\'t get users!', 500);
  }
};

/*
Get all messages from a specific user
*/
const getMessagesFromUserById = (userId, type, friendId,) => {
  const dataMessages = readDataFromMessagesFile();
  try {
    // Filter the array where receiverId equals userId
    // Filter the array where senderId equals userId
    // Filter the array where both receiverId and senderId equal userId
    let messagesType = '';
    if (type === 'received') {
      messagesType = dataMessages.filter(ms => ms.receiverId === userId);
    } else if (type === 'sent') {
      messagesType = dataMessages.filter(ms => ms.senderId === userId);
    } else if (type === 'conversation') {
      messagesType = dataMessages.filter(ms => ms.receiverId === userId && ms.senderId === friendId || ms.receiverId === friendId && ms.senderId === userId);
    }

    if (type === 'received' || type === 'sent') {
      messagesType.sort((a, b) => {
        if (a.createdAt < b.createdAt) {
          return 1;
        } else if (a.createdAt > b.createdAt) {
          return -1;
        }
        return 0;
      });
    }

    if (!messagesType) {
      throw new HTTPError(`Can't find the messages from the user with id ${userId}`, 404);
    }

    return messagesType;
  } catch (error) {
    throw error;
  }
};

/*
Create a new message
*/
const createMessage = (message) => {
  try {
    // Get al messages
    const messages = readDataFromMessagesFile();
    // Create a message
    const messageToCreate = {
      ...message,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    messages.push(messageToCreate);
    // Write message array to the messages.json file
    fs.writeFileSync(filePathMessages, JSON.stringify(messages, null, 2));
    // Return the created message
    return messageToCreate;
  } catch (error) {
    throw new HTTPError('Can\'t create a new message', 501);
  }
};

/*
Update a specific message
*/
const updateMessage = (id, message) => {
  try {
    const messageToUpdate = {
      ...message,
    };
    messageToUpdate.modifiedAt = Date.now();

    // Read the messages.json file
    const messages = readDataFromMessagesFile();
    // Find the index of the message we want to remove
    const findIndex = messages.findIndex((article) => article.id === id);
    if (findIndex === -1) {
      throw new HTTPError(`Cant't find the message with id ${id}!`, 404);
    }
    messages[findIndex] = {
      ...messages[findIndex],
      ...messageToUpdate,
    };
    // Write messages array to the news.json file
    fs.writeFileSync(filePathMessages, JSON.stringify(messages, null, 2));
    // Send response
    return messages[findIndex];
  } catch (error) {
    throw error;
  }
};

/*
Delete a specific message
*/
const deleteMessage = (id) => {
  try {
    // Read the messages.json file
    const messages = readDataFromMessagesFile();
    // Find the index of the post we want to remove
    const findIndex = messages.findIndex((m) => m.id === id);
    if (findIndex === -1) {
      throw new HTTPError(`Cant't find the message with id ${id}!`, 404);
    }
    messages.splice(findIndex, 1);
    // Write messages array to the news.json file
    fs.writeFileSync(filePathMessages, JSON.stringify(messages, null, 2));
    // Send response
    return {
      message: `Successful deleted the users with id ${id}!`,
    };
  } catch (error) {
    throw error;
  }
};

/*
Get all matches
*/
const getMatches = () => {
  try {
    const matches = readDataFromMatchesFile();
    // hier tussen kan er onder andere gesorteerd worden.
    return matches;
  } catch (error) {
    throw new HTTPError('Can\'t get matches!', 500);
  }
};

/*
Get match by sender and receiver id 
*/
const getMatchByIds = (senderId, receiverId) => {
  try {
    const matches = readDataFromMatchesFile();
    // hier tussen kan er onder andere gesorteerd worden.
    const match = matches.find(m => m.userId === senderId && m.friendId === receiverId);

    if (!match) {
      throw new HTTPError(`Can't find the message from messages with ids ${senderId} and ${receiverId}`, 404);
    }

    return match;
  } catch (error) {
    throw new HTTPError('Can\'t get message!', 500);
  }
};

/*
Get all messages from a specific user
*/
const getMatchesFromUserById = (userId) => {
  try {
    const matches = readDataFromMatchesFile();
    // hier tussen kan er onder andere gesorteerd worden.
    let matchesForUser = '';
    matchesForUser = matches.filter(m => m.userId === userId || m.friendId === userId);

    
    if (!matchesForUser) {
      throw new HTTPError(`Can't find the messages from the user with id ${userId}`, 404);
    }

    return matchesForUser;
  } catch (error) {
    throw new HTTPError('Can\'t get matches!', 500);
  }
};

/*
Create a new match
*/
const createMatch = (match) => {
  try {
    // Get al matches
    const matches = readDataFromMatchesFile();
    // Create a match
    const matchToCreate = {
      ...match,
      createdAt: Date.now(),
    };
    matches.push(matchToCreate);
    // Write match array to the matches.json file
    fs.writeFileSync(filePathMatches, JSON.stringify(matches, null, 2));
    // Return the created match
    return matchToCreate;
  } catch (error) {
    throw new HTTPError('Can\'t create a new message', 501);
  }
};

/*
Update a specific post
*/
const updateMatch = (senderId, receiverId, match) => {
  try {
    const matchToUpdate = {
      ...match,
    };
    matchToUpdate.modifiedAt = Date.now();

    // Read the matches.json file
    const matches = readDataFromMatchesFile();
    // Find the index of the match we want to remove
    const findIndex = matches.findIndex(m => m.userId === senderId && m.friendId === receiverId);
    if (findIndex === -1) {
      throw new HTTPError(`Cant't find the post with id ${senderId} and ${receiverId}!`, 404);
    }
    matches[findIndex] = {
      ...matches[findIndex],
      ...matchToUpdate,
    };
    // Write posts array to the news.json file
    fs.writeFileSync(filePathMatches, JSON.stringify(matches, null, 2));
    // Send response
    return matches[findIndex];
  } catch (error) {
    throw error;
  }
};

/*
Delete a specific post
*/
const deleteMatch = (senderId, receiverId) => {
  try {
    // Read the matches.json file
    const matches = readDataFromMatchesFile();
    // Find the index of the matches we want to remove
    const findIndex = matches.findIndex(m => m.userId === senderId && m.friendId === receiverId);
    if (findIndex === -1) {
      throw new HTTPError(`Cant't find the post with id ${senderId} and ${receiverId}!`, 404);
    }
    matches.splice(findIndex, 1);
    // Write matches array to the news.json file
    fs.writeFileSync(filePathMatches, JSON.stringify(matches, null, 2));
    // Send response
    return {
      message: `Successful deleted the post with id ${senderId} and ${receiverId}!`,
    };
  } catch (error) {
    throw error;
  }
};

// Export all the methods of the data service
module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,

  getMessages,
  getMessageById,
  getMessagesFromUserById,
  createMessage,
  updateMessage,
  deleteMessage,

  getMatches,
  getMatchByIds,
  getMatchesFromUserById,
  createMatch,
  updateMatch,
  deleteMatch,
};
