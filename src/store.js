/**
 * @file 数据操作文件
 */

import mongoose from 'mongoose'
import config from './config'

mongoose.connect(config.dbUrl, (err) => {
	if (err) {
		console.error('connect to %s error: %s', dbUrl, err.message)
    	process.exit(1)
	}
})

const Schema = mongoose.Schema

const BlogSchema = new Schema({
	id: Number,
	title: String,
	url: String,
	time: String,
	content: String
})

const BlogModel = mongoose.model('Blog', BlogSchema)

const addBlog = (data, callback) => BlogModel.create(data, callback)

export default {
	addBlog
}