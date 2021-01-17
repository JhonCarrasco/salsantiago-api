const express = require('express')
const bcrypt = require('bcrypt')
const _ = require('underscore')
const mongoose = require('mongoose');
const Course = require('../models/Course')
const Plan = require('../models/Plan')
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


        // trigger in mongodb will be execute every sunday 00:00  
        const newDate = new Date()  
        const dateMoment = moment.utc(newDate)
        const currentDate = dateMoment.tz('America/Santiago')        
        let isoWeek = currentDate.isoWeek() // last week of year = 53
        let isoWeekday = currentDate.isoWeekday() // thursday = 2
        let isoWeekYear = currentDate.isoWeekYear()
        

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

    Attendance.findByIdAndUpdate({ _id }, body,
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
        })
    })

})

// get all attendances weekly for each course after the current date
app.get('/myattendances/:id', verifyToken, (req, res) => {

    const id = req.params.id
    let courseId = new mongoose.Types.ObjectId(id)

    const newDate = new Date()
    const currentDate = moment.utc(newDate).tz('America/Santiago').format('YYYY-MM-DD')
    

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

// get all the assistances of a course according to user - pagination
app.get('/myattendancehistory', verifyToken, async (req, res) => {
    
    const user_id = req.query.user_id
    const course_id = req.query.course_id

    let from = req.query.from || 0
    from = Number(from)
    
    let limit = req.query.limit || 12
    limit = Number(limit)
    
    let courseId = new mongoose.Types.ObjectId(course_id)

    const total = await getTotalAttendanceCourse(course_id, user_id)
    

    Attendance.find({ course_id: courseId })
    .sort({date_session: 'DESC'})
    .populate('course_id', 'description')
    .skip(from)
    .limit(limit)
    .exec()
    .then( async (response) => {
        
        let arrAttendance = await response.reduce((attendances, items) => {
            
            items.concurrence.forEach(elem => {
                if ( user_id === elem ) {
                    attendances.push(items)
                }
            })
            return attendances
        },[])

        if(!arrAttendance || arrAttendance.length === 0) {
            return res.json({
                ok: false,
                err: {
                    message: 'Sin contenido'
                }
            })
        }


        return res.json({
            ok: true,
            total,
            size: arrAttendance.length,
            obj: arrAttendance
        })
    })
    .catch(err => {
        return res.status(500).json({
            ok: false,            
            err: {
                message: 'Error Server'
            }
        })
    })

})

// get all the attendance of the current day courses
app.get('/myattendancetoday', verifyToken, async (req, res) => {
    
    const user_id = req.query.user_id    
    let userId = new mongoose.Types.ObjectId(user_id)    

    Plan.aggregate([
        {$match: { state: true, user_id: userId }},
        {$sort:{'initiate':-1}}, 
        
        { $lookup: {from: 'courses', localField: 'course_id', foreignField: '_id', as: 'course'} },
        
        {$group:{ _id: '$course_id',group:{$first:'$$ROOT'}}},
        {$replaceRoot:{newRoot:"$group"}},
        {
            "$project": {            
              "course._id": 1
            }
          }
       ])
       .exec(async function (err, obj) {
        if (err) {
            res.status(500).json({
                ok: false,
                err
            });
        }

        if (!obj) {
            res.status(400).json({
                ok: false,
                err
            });
        }
                
        const arrCourse = await obj.reduce((courses, item) => {
            let arrSchedule = item.course.reduce((schedules, element) => {
                schedules.push(element)
                return schedules
            }, [])
            courses.push(arrSchedule[0]._id)
            return courses
        }, [])        
        
        const newDate = new Date()
        const currentDate = moment.utc(newDate).tz('America/Santiago').format('YYYY-MM-DD')
        
        Attendance.find({state: true, course_id: { $in: arrCourse }
            , date_session: { $gte: new Date(currentDate) }
        })
        .sort({date_session: 'ASC'})
        .populate('course_id', 'description instructor classroom capacity')
        .exec(async (err, arrObj) => {
            if (err) {
                res.status(500).json({
                    ok: false,
                    err: {
                        message: 'error server'
                    },
                    date: currentDate
                });
            }
    
            if (!arrObj) {
                res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No encontrado'
                    },
                    date: currentDate
                });
            }

            return  res.json({
                ok: true,
                obj: arrObj,
                date: currentDate
            });
        })
        
      }
    );

    

})

async function getTotalAttendanceCourse(course_id, user_id) {
    
    let courseId = new mongoose.Types.ObjectId(course_id)
    
    const attendanceResult = await Attendance.find({ course_id: courseId }).exec()
    let arrAttendance = await attendanceResult.reduce((attendances, items) => {
            
        items.concurrence.forEach(elem => {
            if ( user_id === elem ) {
                attendances.push(items)
            }
        })
        return attendances
    },[])
    
    return arrAttendance.length
}


//borrar en produccion
app.post('/insertar', verifyToken, (req, res) => {
    let id = req.body._id
    let body = req.body
    // console.log(body)
    try {
        Attendance.findByIdAndUpdate( id, body,  
            (err, objDB) => {
   
           if (err) 
               return res.status(400).json({
                   ok: false,
                   err
               })
   
           res.json({
               ok: true,
               // obj: objDB,
           })
       })
    }
    catch(e) {
        console.log(e)
    }
    // res.send('ok')
})


module.exports = app