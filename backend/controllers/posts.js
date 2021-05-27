const express = require('express');
const Post = require('../models/post');
const checkAuth = require('../middleware/check-auth');

exports.requestPost = (req, res, next) => {
  const post = new Post({
    orgName: req.body.orgName,
    uen: req.body.uen,
    POC: req.body.POC,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    title: req.body.title,
    content: req.body.content,
    skills: req.body.skills,

    startDate: req.body.startDate,
    endDate: req.body.endDate,
    hoursRequired: req.body.hoursRequired,

    beneficiaries: req.body.beneficiaries,
    appproved: false,
    creator: req.userData.userId,
    students: [],
  });
  post.save() //creates a new post document stored in collections. Name will be plural from of models name. so schema was Post, stored is posts (lowercase)
    .then(createdPost => {
      res.status(201).json({message: "post requested successfully! Pending admin approval", postId: createdPost._id});
    });
};

exports.getAllPosts = (req, res, next) => {
  Post.find()
    .then(documents => {
      res.status(200).json({
        message: "Posts fetched successfully",
        posts: documents,
      });
    })
    .catch(e => {
      console.log("Error occured at backend/app app.get");
    });
};

exports.deletePost = (req, res, next) => {
  //console.log(req.userData.role);

  if (req.userData.role === 'Admin') {
    Post.deleteOne({_id: req.params.id})
    .then((result) => {
      if (result.n > 0) {
        res.status(200).json({message: "Post delete request sent!"});
      } else {
        res.status(401).json({ message: "Not authorised to delete!"});
      }
    });
    console.log("post deleted by administrator!")
    // .then((result) => {
    //   console.log(result);
    // });
  } else {
    Post.deleteOne({ _id: req.params.id, creator: req.userData.userId, }) //change creator field to orgName?
    .then((result) => {
      if (result.n > 0) {
        res.status(200).json({message: "Post delete request sent!"});
      } else {
        res.status(401).json({ message: "Not authorised to delete!"});
      }
    });
  }
};


exports.publishPost = (req, res, next) => { //publish function to change approved from false to true
  //  console.log("router.put request fired!");
    const newPost = new Post({
      _id: req.body.id,
      orgName: req.body.orgName,
      uen: req.body.uen,
      POC: req.body.POC,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      title: req.body.title,
      content: req.body.content,
      skills: req.body.skills,

      startDate: req.body.startDate,
      endDate: req.body.endDate,
      hoursRequired: req.body.hoursRequired,

      beneficiaries: req.body.beneficiaries,
      approved: true,
      students: [],
      creator: req.body.id,
      //creator: req.userData.userId
    });
    Post.updateOne({_id: req.params.id}, newPost).then(result => {
      //console.log(result);
      res.status(200).json("Post published!");
    });
  };

 exports.applyPost = (req, res, next) => {
  //publish function to change approved from false to true
  console.log("apply Post's put posts route fired!");
  const newPost = new Post({
    _id: req.body.id,
    orgName: req.body.orgName,
    uen: req.body.uen,
    POC: req.body.POC,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    title: req.body.title,
    content: req.body.content,
    skills: req.body.skills,

    startDate: req.body.startDate,
    endDate: req.body.endDate,
    hoursRequired: req.body.hoursRequired,

    beneficiaries: req.body.beneficiaries,
    approved: true,
    students: req.body.students,
    creator: req.body.id,
    //creator: req.userData.userId
  });
  console.log("New post to be added into is: ");
  console.log(newPost);

  Post.findByIdAndUpdate(req.body.id, newPost).then((result) => {
    //console.log(result);
    res.status(200).json("Post published!");
  });
};