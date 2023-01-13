// 'use strict'

// const chromium = require('chrome-aws-lambda')
// const { addExtra } = require('puppeteer-extra')
// const StealthPlugin = require('puppeteer-extra-plugin-stealth')

// const puppeteer = addExtra(chromium.puppeteer)
// puppeteer.use(StealthPlugin)
// const sites = [
//   {
//     url: 'https://www.linkedin.com',
//     source: 'XXX',
//     waitSelector: '.quote-container',
//     container: '.current-exchange',
//     elements: '.price > .amount > .number',
//     buyPosition: 0,
//     sellPosition: 1,
//   },
// ]

// exports.handler = async (event, context, callback) => {
//   const browser = await puppeteer.launch({
//     args: chromium.args,
//     defaultViewport: chromium.defaultViewport,
//     executablePath: await chromium.executablePath,
//     headless: true,
//     ignoreHTTPSErrors: true,
//   })

//   await Promise.all(
//     sites.map(async (site) => {
//       const page = await browser.newPage()

//       const data = await processor(page, site)

//       console.log(data)

//       return site
//     })
//   )

//   await browser.close()
// }

const processor = async (page, site) => {
  await page.goto(site.url)
  await page.waitForTimeout(5000)
  // await page.waitForSelector(site.waitSelector, {
  //   timeout: 60000,
  // })

  // const container = await page.$(site.container)

  // const results = await page.evaluate(
  //   (site, container) => {
  //     const elementsMap = container.querySelectorAll(site.elements)
  //     const items = elementsMap

  //     return {
  //       buy: items[site.buyPosition].textContent,
  //       sell: items[site.sellPosition].textContent,
  //       avg: site.avgPosition ? items[site.avgPosition].textContent : undefined,
  //     }
  //   },
  //   site,
  //   container
  // )

  // return {
  //   source: site.source,
  //   buy: parseFloat(results.buy.replace(',', '.')),
  //   sell: parseFloat(results.sell.replace(',', '.')),
  //   average: results.avg
  //     ? parseFloat(results.avg.replace(',', '.'))
  //     : undefined,
  // }

  const LINKEDIN_AUTH_USERNAME = 'joaoricardo15@hotmail.com'
  const LINKEDIN_AUTH_PASSWORD = 'Joao2020'

  try {
    await page.evaluate(
      (username, password) => {
        document.querySelector('#session_key').value = username
        document.querySelector('#session_password').value = password
        document
          .getElementsByClassName('sign-in-form__submit-button')[0]
          .click()
      },
      LINKEDIN_AUTH_USERNAME,
      LINKEDIN_AUTH_PASSWORD
    )

    await page.waitForNavigation({ waitUntil: 'networkidle2' })
  } catch (error) {}

  await page.evaluate(async () => {
    // await new Promise((resolve) => {
    //   var totalHeight = 0;
    //   var distance = 100;
    //   var timer = setInterval(() => {
    //     var scrollHeight = document.body.scrollHeight;
    //     window.scrollBy(0, distance);
    //     totalHeight += distance;

    //     if(totalHeight >= scrollHeight - window.innerHeight){
    //         clearInterval(timer);
    //         resolve();
    //     }
    //   }, 100);
    // });

    const postComponents = Array.from(
      document.querySelectorAll('div.scaffold-finite-scroll__content>div')
    )
      .map((element) => {
        if (element.getElementsByClassName('feed-shared-actor').length) {
          const id = element.querySelector(
              'div div[data-id*="urn:li:activity:"]'
            ),
            header = element.querySelector(
              'div.feed-shared-header div.feed-shared-header__text-wrapper'
            ),
            icon = element.querySelector('img.feed-shared-actor__avatar-image'),
            name = element.querySelector('span.feed-shared-actor__name span'),
            description = element.querySelector(
              'span.feed-shared-actor__description'
            ),
            body = element.querySelector('div.feed-shared-text span span span'),
            content = element.querySelector('div.feed-shared-text span span'),
            image = element.querySelector('img.feed-shared-image__image'),
            article = element.querySelector('article.feed-shared-article'),
            reactions = element.querySelector(
              'span.social-details-social-counts__reactions-count'
            ),
            comments = element.querySelector(
              'li.social-details-social-counts__comments span'
            )

          return {
            id: id.getAttribute('data-id').split('urn:li:activity:')[1],
            header: header && header.innerHTML,
            icon: icon && icon.src,
            name: name && name.innerText,
            description: description && description.innerText,
            body: body && body.innerText,
            content: content && content.innerText,
            image: image && image.src,
            article: article && article.innerHTML,
            reactions: reactions && parseInt(reactions.innerText),
            comments: comments && parseInt(comments.innerText.split(' ')[0]),
          }
        }
      })
      .filter((article) => !!article)

    console.log(postComponents)
  })

  // await browser.close()
}
