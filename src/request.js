/**
 * @file request主文件
 */

import originRequest from 'request'
import async from 'async'
import cheerio from 'cheerio'
import debug from 'debug'
import entities from 'entities'

import config from './config'
import BlogModel from './store'


const log = debug('request')
const request = (url, callback) => originRequest(url, callback) 

// 归档列表
let archiveList = []
// 文章列表
let articleList = []



const getArchiveList = (url, callback) => {
	log('读取归档列表 %s', url)

	request(url, (err, response, body) => {
		if (err) return callback(err)

		if (response.statusCode == 200) {
			let $ = cheerio.load(body, {decodeEntities: false})
			let $links = $('.widget_archive li a')
			let tmpArchiveList = [];

			$links.each(function () {
				let $link = $(this)

				tmpArchiveList.push({
					name: $link.text().trim(),
					url: $link.attr('href')
				})
			})

			callback(null, tmpArchiveList)
		}
	})
}

const getArticleList = (url, callback) => {
	url = entities.decodeHTML(url);

	log('读取文章列表 %s', url)

	request(url, (err, response, body) => {
		if (err) return callback(err)

		if (response.statusCode == 200) {
			let $ = cheerio.load(body, {decodeEntities: false})
			let $articles = $('article')
			let tmpArticleList = []

			$articles.each(function () {
				let $this = $(this);
				let $link = $this.find('.entry-title a');

				tmpArticleList.push({
					id: $this.attr('id').match(/-(\d+)$/)[1],
					title: $link.text().trim(),
					url: $link.attr('href'),
					time: $this.find('.entry-meta .entry-date').attr('datetime'),
					content: $this.find('.entry-content').html()
				})
			})

			let $preLink = $('.nav-previous a')

			if ($preLink.length) {
				let preUrl = $preLink.eq(0).attr('href')

				getArticleList(preUrl, (err, tmpArticleList2) => {
					if (err) return callback(err)

					tmpArticleList = tmpArticleList.concat(tmpArticleList2)
					callback(null, tmpArticleList)
				});
			}
			else {
				callback(null, tmpArticleList)
			}
		}
	})
}

// getArticleList('http://visiblemind.org/?m=200711', function () {})

async.series([
	(done) => {
		getArchiveList(config.blogUrl, (err, tmpArchiveList) => {
			archiveList = tmpArchiveList
			done(err)
		})
	},
	(done) => {
		async.eachSeries(archiveList, (archive, next) => {
			getArticleList(archive.url, (err, tmpArticleList) => {
				articleList = articleList.concat(tmpArticleList)

				//console.dir(tmpArticleList)
				next(err)
			})
		}, done)
	}
], (err) => {
	if (err) return console.error(err)

	log('存档条数 %s', archiveList.length)
	log('文章条数 %s', articleList.length)

	// async.eachSeries(articleList, (article, next) => {
	// 	BlogModel.addBlog(article, (err, data) => {
	// 		log('插入文章 %s', article.title)
	// 		next(err)
	// 	})
	// })
})


