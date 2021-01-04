const express = require('express')
const bcrypt = require('bcrypt')
const _ = require('underscore')
const mongoose = require('mongoose');
const Course = require('../models/Course')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const moment = require('moment-timezone')
const Attendance = require('../models/Attendance')
const app = express()


// create weekly attendance for each course
app.post('/attendances', (req, res) => {


   Course.find({state: true })
   .exec(async (err, objs) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: "Error in server"
                }
            })
        }

        if (!objs) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: "not found registers"
                }
            })
        }


        // trigger in mongodb will be execute every saturday 22:00  
        const currentDate = new Date()
        let isoWeek = moment(currentDate).isoWeek() // last week of year = 53
        let isoWeekday = moment(currentDate).isoWeekday() // thursday = 2
        let isoWeekYear = moment(currentDate).isoWeekYear()

                
        // if (isoWeekday === 6) {
        //     return res.json({
        //         ok: false,
        //         err: {
        //             message: "It's not saturday"
        //         }
        //     })
        // }

        const arrAttendance = await objs.reduce((courses, item) => {
            let arrSchedule = item.schedule.reduce((schedules, element) => {

                let dateSession = moment()
                .isoWeekYear(isoWeekYear)
                .isoWeek(isoWeek + 1)
                .isoWeekday(element.day)

                let dateSessionFormat = dateSession.format('YYYY-MM-DD')                
                let datetimeSession = moment.utc(dateSessionFormat + " " + element.hour)
                
                let attendanceObj = new Attendance()
                attendanceObj.course_id = item._id
                attendanceObj.date_session = datetimeSession
                
                schedules.push(attendanceObj)
                return schedules

            }, [])

            courses.push(arrSchedule)
            return courses
        }, [])

        const arrOneLevel = await arrAttendance.reduce((acc, el) => acc.concat(el), [])
        
        try {
            Attendance.insertMany( arrOneLevel, (err, objsDB) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err: {
                            message: 'Error in server'
                        }
                    })
                }

                if (!objsDB) {
                    return res.status(400).json({
                        ok: false,
                        err: 'not inserted'
                    })
                }
            
                return res.json({
                    ok: true,
                    obj: objsDB
                })
            
           
            })
         } catch (e) {
            return res.json({
                ok: false,
                err: {
                    message: "there was an error when inserting 'attendance'"
                }
            })
         }
        

    })            

})

// get all attendances weekly for each course after the current date
app.get('/myattendances/:id', verifyToken, (req, res) => {

    const id = req.params.id
    let courseId = new mongoose.Types.ObjectId(id)

    const currentDate = new Date()
    

    Attendance.find({state: true, course_id: courseId, date_session: { $gte: currentDate}})
    .sort({date_session: 'ASC'})
    .populate('course_id', 'description instructor classroom capacity')
    .exec((err, obj) => {

        if(err) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'Error server'
                }
            })
        }

        if (!obj) 
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'find empty'
                }
            })
        
        return res.json({
            ok: true,
            obj
        })
    })
    
    // Attendance.aggregate([
    //     {$match: { state: true, course_id: courseId, date_session: { $gte: currentDate} }},
    //     {$sort:{'initiate':1}}, 
        
    //     { $lookup: {from: 'courses', localField: 'course_id', foreignField: '_id', as: 'course'} },
        
    //     // {$group:{ _id: '$course_id',group:{$first:'$$ROOT'}}},
    //     // {$replaceRoot:{newRoot:"$group"}},
    //     {
    //         "$project": {
    //           "_id": 1,
    //         //   "concurrence": 1,
    //           "state": 1,
    //           "date_session": 1,
    //           "course._id": 1,
    //           "course.description": 1,
    //           "course.intructor": 1,
    //           "course.classroom": 1,
    //           "course.capacity": 1
    //         }
    //     }
    //    ])
    //    .exec( function (err, obj) {
    //     if (err) {
    //         res.json({
    //             ok: false,
    //             err
    //         });
    //     }
        
    //     res.json({
    //         ok: true,
    //         obj
    //     });
    //   }
    // );
       
})

// get by id attendance
app.get('/attendances/:id', verifyToken, (req, res) => {

    const _id = req.params.id

    Attendance.findById({ _id })
    .populate('course_id', 'description instructor classroom capacity')
    .exec((err, obj) => {

        if(err) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'Error server'
                }
            })
        }

        if (!obj) 
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'findById empty'
                }
            })
        
        return res.json({
            ok: true,
            obj
        })
    })
       
})

app.put('/myattendances/:id', verifyToken, (req, res) => {

    // ID from Attendance
    const _id = req.params.id
    
    let body = _.pick(req.body, ['concurrence'])

    Attendance.findOneAndUpdate({_id, state: true}, body,
        // { new: true
        // , runValidators: true 
        // , context: 'query'
        // },
        (err, objDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err: {
                        message: 'Error server'
                    }
                })
            }            

            if (!objDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Not exist'
                    }
                })
            }
            

        return res.json({
            ok: true,
            // obj: objDB,
        })
    })

})

module.exports = app