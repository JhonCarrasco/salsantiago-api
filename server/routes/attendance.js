const express = require('express')
const bcrypt = require('bcrypt')
const _ = require('underscore')
const Course = require('../models/Course')
const { verifyToken, verifyAdminRole } = require('../middlewares/authentication')
const moment = require('moment-timezone')
const Attendance = require('../models/Attendance')
const app = express()



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


            
        const currentDate = new Date()
        let isoWeek = moment(currentDate).isoWeek() // last week of year = 53
        let dayWeek = moment(currentDate).day() // thursday = 2
        let year = moment(currentDate).year()

        
        // if (dayWeek === 0) {
        //     return res.json({
        //         ok: false,
        //         err: {
        //             message: "It's not sunday"
        //         }
        //     })
        // }

        const arrAttendance = await objs.reduce((courses, item) => {
            let arrSchedule = item.schedule.reduce((schedules, element) => {

                let dateSession = moment()
                .isoWeekYear(year)
                .isoWeek(isoWeek)
                .day(dayWeek + element.day)

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

module.exports = app