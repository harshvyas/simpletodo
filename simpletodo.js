Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {

    Meteor.subscribe("tasks");
    Template.body.events({
       'submit .new-task': function(event){
           var text = event.target.text.value;
           Meteor.call("addTask",text);
           event.target.text.value="";
           return false;
       },
       'change .hide-completed input': function(event){
           Session.set("hideCompleted",event.target.checked);
       }
    });

    Template.body.helpers({
       tasks: function(){
           if(Session.get("hideCompleted")){
               return Tasks.find({checked:{$ne:true}},{sort:{createdAt:-1}});
           }else{
               return Tasks.find({},{sort: {createdAt: -1}});
           }

       },
       hideCompleted: function(){
           Session.get("hideCompleted");
       },
       incompleteTaskCount: function(){
           return Tasks.find({checked:{$ne:true}}).count();
       }
    });

    Template.task.events({
       'click .toggle-checked':function(){
           Meteor.call("updateTask",this._id,!this.checked);
       },
       'click .delete':function(){
           Meteor.call("deleteTask",this._id);
       },
       'click .toggle-private':function(){
           Meteor.call("setPrivate",this._id,!this.private);
       }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

    Template.task.helpers({
       isOwner: function(){
           return this.owner === Meteor.userId();
       }
    });
}

if (Meteor.isServer) {
    Meteor.publish("tasks",function(){
        return Tasks.find({
            $or: [
                {private:{$ne:true}},
                {owner:this.userId}
            ]
        });
    });
}

Meteor.methods({
   addTask: function(text){
       if(!Meteor.userId()){
           throw new Meteor.Error("not-authorized");
       }

       Tasks.insert({
           text: text,
           createdAt: new Date(),
           owner: Meteor.userId(),
           username: Meteor.user().username
       })
   },
   updateTask: function(taskId, setChecked){
       var task = Tasks.findOne(taskId);
       if(task.private && task.owner !==Meteor.userId())
       {
           throw new Meteor.Error("not-authorized");
       }
       Tasks.update(taskId,{$set:{checked:setChecked}});
   },
   deleteTask: function(taskId){
       var task = Tasks.findOne(taskId);
       if(task.private && task.owner !==Meteor.userId())
       {
           throw new Meteor.Error("not-authorized");
       }
       Tasks.remove(taskId);
   },
   setPrivate: function(taskId, setToPrivate){
       var task = Tasks.findOne(taskId);

       if(task.owner !== Meteor.userId()){
           throw new Meteor.Error("not-authorized");
       }

       Tasks.update(taskId,{$set:{private:setToPrivate}});
   }
});