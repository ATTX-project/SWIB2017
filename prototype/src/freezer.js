import Freezer from 'freezer-js';


var freezer = new Freezer({
    workflows: [
      {
        id: '1',
        title: 'sample workflow'
      }
    ],
    workflowExecutions: [],
    vis: ''


});

window.hub = freezer.getEventHub();

module.exports = freezer;
