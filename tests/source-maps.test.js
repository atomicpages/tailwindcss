import postcss from 'postcss'
import { parseSourceMaps } from './util/source-maps'
import { runWithSourceMaps as run, html, css, map } from './util/run'

test('apply generates source maps', async () => {
  let config = {
    content: [
      {
        raw: html`
          <div class="with-declaration"></div>
          <div class="with-comment"></div>
          <div class="just-apply"></div>
        `,
      },
    ],
    corePlugins: { preflight: false },
  }

  let input = css`
    .with-declaration {
      background-color: red;
      @apply h-4 w-4 bg-green-500;
    }

    .with-comment {
      /* sourcemap will work here too */
      @apply h-4 w-4 bg-red-500;
    }

    .just-apply {
      @apply h-4 w-4 bg-black;
    }
  `

  let result = await run(input, config)
  let { sources, annotations } = parseSourceMaps(result)

  // All CSS generated by Tailwind CSS should be annotated with source maps
  // And always be able to point to the original source file
  expect(sources).not.toContain('<no source>')
  expect(sources.length).toBe(1)

  expect(annotations).toEqual([
    '2:4 -> 2:4',
    '3:6-27 -> 3:6-27',
    '4:6-33 -> 4:6-18',
    '4:6-33 -> 5:6-17',
    '4:6-33 -> 6:6-24',
    '4:6-33 -> 7:6-64',
    '5:4 -> 8:4',
    '7:4 -> 10:4',
    '8:6-39 -> 11:6-39',
    '9:6-31 -> 12:6-18',
    '9:6-31 -> 13:6-17',
    '9:6-31 -> 14:6-24',
    '9:6-31 -> 15:6-64',
    '10:4 -> 16:4',
    '13:6 -> 18:4',
    '13:6-29 -> 19:6-18',
    '13:6-29 -> 20:6-17',
    '13:6-29 -> 21:6-24',
    '13:6 -> 22:6',
    '13:29 -> 23:0',
  ])
})

test('preflight + base have source maps', async () => {
  let config = {
    content: [],
  }

  let input = css`
    @tailwind base;
  `

  let result = await run(input, config)
  let { sources, annotations } = parseSourceMaps(result)

  // All CSS generated by Tailwind CSS should be annotated with source maps
  // And always be able to point to the original source file
  expect(sources).not.toContain('<no source>')
  expect(sources.length).toBe(1)

  expect(annotations).toEqual([
    '2:4 -> 1:0',
    '2:4-18 -> 2:2-26',
    '2:4-18 -> 3:2-26',
    '2:4-18 -> 4:2-21',
    '2:4-18 -> 5:2-21',
    '2:4-18 -> 6:2-16',
    '2:4-18 -> 7:2-16',
    '2:4-18 -> 8:2-16',
    '2:4-18 -> 9:2-17',
    '2:4-18 -> 10:2-17',
    '2:4-18 -> 11:2-15',
    '2:4-18 -> 12:2-15',
    '2:4-18 -> 13:2-20',
    '2:4-18 -> 14:2-40',
    '2:4-18 -> 15:2-32',
    '2:4-18 -> 16:2-31',
    '2:4-18 -> 17:2-30',
    '2:4-18 -> 18:2-17',
    '2:4-18 -> 19:2-22',
    '2:4-18 -> 20:2-24',
    '2:4-18 -> 21:2-25',
    '2:4-18 -> 22:2-26',
    '2:4-18 -> 23:2-20',
    '2:4-18 -> 24:2-29',
    '2:4-18 -> 25:2-30',
    '2:4-18 -> 26:2-40',
    '2:4-18 -> 27:2-36',
    '2:4-18 -> 28:2-29',
    '2:4-18 -> 29:2-24',
    '2:4-18 -> 30:2-32',
    '2:4-18 -> 31:2-14',
    '2:4-18 -> 32:2-20',
    '2:4-18 -> 33:2-18',
    '2:4-18 -> 34:2-19',
    '2:4-18 -> 35:2-20',
    '2:4-18 -> 36:2-16',
    '2:4-18 -> 37:2-18',
    '2:4-18 -> 38:2-15',
    '2:4-18 -> 39:2-21',
    '2:4-18 -> 40:2-23',
    '2:4-18 -> 41:2-29',
    '2:4-18 -> 42:2-27',
    '2:4-18 -> 43:2-28',
    '2:4-18 -> 44:2-29',
    '2:4-18 -> 45:2-25',
    '2:4-18 -> 46:2-26',
    '2:4-18 -> 47:2-27',
    '2:4-18 -> 48:2-24',
    '2:4-18 -> 49:2-22',
    '2:4-18 -> 50:2-24',
    '2:4-18 -> 51:2-23',
    '2:4 -> 52:2',
    '2:18 -> 53:0',
    '2:4 -> 55:0',
    '2:4-18 -> 56:2-26',
    '2:4-18 -> 57:2-26',
    '2:4-18 -> 58:2-21',
    '2:4-18 -> 59:2-21',
    '2:4-18 -> 60:2-16',
    '2:4-18 -> 61:2-16',
    '2:4-18 -> 62:2-16',
    '2:4-18 -> 63:2-17',
    '2:4-18 -> 64:2-17',
    '2:4-18 -> 65:2-15',
    '2:4-18 -> 66:2-15',
    '2:4-18 -> 67:2-20',
    '2:4-18 -> 68:2-40',
    '2:4-18 -> 69:2-32',
    '2:4-18 -> 70:2-31',
    '2:4-18 -> 71:2-30',
    '2:4-18 -> 72:2-17',
    '2:4-18 -> 73:2-22',
    '2:4-18 -> 74:2-24',
    '2:4-18 -> 75:2-25',
    '2:4-18 -> 76:2-26',
    '2:4-18 -> 77:2-20',
    '2:4-18 -> 78:2-29',
    '2:4-18 -> 79:2-30',
    '2:4-18 -> 80:2-40',
    '2:4-18 -> 81:2-36',
    '2:4-18 -> 82:2-29',
    '2:4-18 -> 83:2-24',
    '2:4-18 -> 84:2-32',
    '2:4-18 -> 85:2-14',
    '2:4-18 -> 86:2-20',
    '2:4-18 -> 87:2-18',
    '2:4-18 -> 88:2-19',
    '2:4-18 -> 89:2-20',
    '2:4-18 -> 90:2-16',
    '2:4-18 -> 91:2-18',
    '2:4-18 -> 92:2-15',
    '2:4-18 -> 93:2-21',
    '2:4-18 -> 94:2-23',
    '2:4-18 -> 95:2-29',
    '2:4-18 -> 96:2-27',
    '2:4-18 -> 97:2-28',
    '2:4-18 -> 98:2-29',
    '2:4-18 -> 99:2-25',
    '2:4-18 -> 100:2-26',
    '2:4-18 -> 101:2-27',
    '2:4-18 -> 102:2-24',
    '2:4-18 -> 103:2-22',
    '2:4-18 -> 104:2-24',
    '2:4-18 -> 105:2-23',
    '2:4 -> 106:2',
    '2:18-4 -> 107:0-1',
    '2:18-4 -> 109:1-2',
    '2:18 -> 112:1',
    '2:4 -> 114:0',
    '2:4-18 -> 117:2-32',
    '2:4-18 -> 118:2-25',
    '2:4-18 -> 119:2-29',
    '2:4-18 -> 120:2-31',
    '2:18 -> 121:0',
    '2:4 -> 123:0',
    '2:4-18 -> 125:2-18',
    '2:18 -> 126:0',
    '2:4 -> 128:0',
    '2:18 -> 136:1',
    '2:4 -> 138:0',
    '2:4-18 -> 140:2-26',
    '2:4-18 -> 141:2-40',
    '2:4-18 -> 142:2-26',
    '2:4-18 -> 143:2-21',
    '2:4-18 -> 144:2-137',
    '2:4-18 -> 145:2-39',
    '2:4-18 -> 146:2-41',
    '2:4-18 -> 147:2-50',
    '2:18 -> 148:0',
    '2:4 -> 150:0',
    '2:18 -> 153:1',
    '2:4 -> 155:0',
    '2:4-18 -> 156:2-19',
    '2:4-18 -> 157:2-30',
    '2:18 -> 158:0',
    '2:4 -> 160:0',
    '2:18 -> 164:1',
    '2:4 -> 166:0',
    '2:4-18 -> 167:2-19',
    '2:4-18 -> 168:2-24',
    '2:4-18 -> 169:2-31',
    '2:18 -> 170:0',
    '2:4 -> 172:0',
    '2:18 -> 174:1',
    '2:4 -> 176:0',
    '2:4-18 -> 177:2-35',
    '2:18 -> 178:0',
    '2:4 -> 180:0',
    '2:18 -> 182:1',
    '2:4 -> 184:0',
    '2:4-18 -> 190:2-20',
    '2:4-18 -> 191:2-22',
    '2:18 -> 192:0',
    '2:4 -> 194:0',
    '2:18 -> 196:1',
    '2:4 -> 198:0',
    '2:4-18 -> 199:2-16',
    '2:4-18 -> 200:2-26',
    '2:18 -> 201:0',
    '2:4 -> 203:0',
    '2:18 -> 205:1',
    '2:4 -> 207:0',
    '2:4-18 -> 209:2-21',
    '2:18 -> 210:0',
    '2:4 -> 212:0',
    '2:18 -> 217:1',
    '2:4 -> 219:0',
    '2:4-18 -> 223:2-121',
    '2:4-18 -> 224:2-39',
    '2:4-18 -> 225:2-41',
    '2:4-18 -> 226:2-24',
    '2:18 -> 227:0',
    '2:4 -> 229:0',
    '2:18 -> 231:1',
    '2:4 -> 233:0',
    '2:4-18 -> 234:2-16',
    '2:18 -> 235:0',
    '2:4 -> 237:0',
    '2:18 -> 239:1',
    '2:4 -> 241:0',
    '2:4-18 -> 243:2-16',
    '2:4-18 -> 244:2-16',
    '2:4-18 -> 245:2-20',
    '2:4-18 -> 246:2-26',
    '2:18 -> 247:0',
    '2:4 -> 249:0',
    '2:4-18 -> 250:2-17',
    '2:18 -> 251:0',
    '2:4 -> 253:0',
    '2:4-18 -> 254:2-13',
    '2:18 -> 255:0',
    '2:4 -> 257:0',
    '2:18 -> 261:1',
    '2:4 -> 263:0',
    '2:4-18 -> 264:2-24',
    '2:4-18 -> 265:2-31',
    '2:4-18 -> 266:2-35',
    '2:18 -> 267:0',
    '2:4 -> 269:0',
    '2:18 -> 273:1',
    '2:4 -> 275:0',
    '2:4-18 -> 280:2-30',
    '2:4-18 -> 281:2-40',
    '2:4-18 -> 282:2-42',
    '2:4-18 -> 283:2-25',
    '2:4-18 -> 284:2-30',
    '2:4-18 -> 285:2-30',
    '2:4-18 -> 286:2-33',
    '2:4-18 -> 287:2-24',
    '2:4-18 -> 288:2-19',
    '2:4-18 -> 289:2-20',
    '2:18 -> 290:0',
    '2:4 -> 292:0',
    '2:18 -> 294:1',
    '2:4 -> 296:0',
    '2:4-18 -> 298:2-22',
    '2:18 -> 299:0',
    '2:4 -> 301:0',
    '2:18 -> 304:1',
    '2:4 -> 306:0',
    '2:4-18 -> 310:2-36',
    '2:4-18 -> 311:2-39',
    '2:4-18 -> 312:2-32',
    '2:18 -> 313:0',
    '2:4 -> 315:0',
    '2:18 -> 317:1',
    '2:4 -> 319:0',
    '2:4-18 -> 320:2-15',
    '2:18 -> 321:0',
    '2:4 -> 323:0',
    '2:18 -> 325:1',
    '2:4 -> 327:0',
    '2:4-18 -> 328:2-18',
    '2:18 -> 329:0',
    '2:4 -> 331:0',
    '2:18 -> 333:1',
    '2:4 -> 335:0',
    '2:4-18 -> 336:2-26',
    '2:18 -> 337:0',
    '2:4 -> 339:0',
    '2:18 -> 341:1',
    '2:4 -> 343:0',
    '2:4-18 -> 345:2-14',
    '2:18 -> 346:0',
    '2:4 -> 348:0',
    '2:18 -> 351:1',
    '2:4 -> 353:0',
    '2:4-18 -> 354:2-39',
    '2:4-18 -> 355:2-30',
    '2:18 -> 356:0',
    '2:4 -> 358:0',
    '2:18 -> 360:1',
    '2:4 -> 362:0',
    '2:4-18 -> 363:2-26',
    '2:18 -> 364:0',
    '2:4 -> 366:0',
    '2:18 -> 369:1',
    '2:4 -> 371:0',
    '2:4-18 -> 372:2-36',
    '2:4-18 -> 373:2-23',
    '2:18 -> 374:0',
    '2:4 -> 376:0',
    '2:18 -> 378:1',
    '2:4 -> 380:0',
    '2:4-18 -> 381:2-20',
    '2:18 -> 382:0',
    '2:4 -> 384:0',
    '2:18 -> 386:1',
    '2:4 -> 388:0',
    '2:4-18 -> 401:2-11',
    '2:18 -> 402:0',
    '2:4 -> 404:0',
    '2:4-18 -> 405:2-11',
    '2:4-18 -> 406:2-12',
    '2:18 -> 407:0',
    '2:4 -> 409:0',
    '2:4-18 -> 410:2-12',
    '2:18 -> 411:0',
    '2:4 -> 413:0',
    '2:4-18 -> 416:2-18',
    '2:4-18 -> 417:2-11',
    '2:4-18 -> 418:2-12',
    '2:18 -> 419:0',
    '2:4 -> 421:0',
    '2:18 -> 423:1',
    '2:4 -> 424:0',
    '2:4-18 -> 425:2-12',
    '2:18 -> 426:0',
    '2:4 -> 428:0',
    '2:18 -> 430:1',
    '2:4 -> 432:0',
    '2:4-18 -> 433:2-18',
    '2:18 -> 434:0',
    '2:4 -> 436:0',
    '2:18 -> 439:1',
    '2:4 -> 441:0',
    '2:4-18 -> 443:2-20',
    '2:4-18 -> 444:2-24',
    '2:18 -> 445:0',
    '2:4 -> 447:0',
    '2:18 -> 449:1',
    '2:4 -> 451:0',
    '2:4-18 -> 453:2-17',
    '2:18 -> 454:0',
    '2:4 -> 456:0',
    '2:18 -> 458:1',
    '2:4 -> 459:0',
    '2:4-18 -> 460:2-17',
    '2:18 -> 461:0',
    '2:4 -> 463:0',
    '2:18 -> 467:1',
    '2:4 -> 469:0',
    '2:4-18 -> 477:2-24',
    '2:4-18 -> 478:2-32',
    '2:18 -> 479:0',
    '2:4 -> 481:0',
    '2:18 -> 483:1',
    '2:4 -> 485:0',
    '2:4-18 -> 487:2-17',
    '2:4-18 -> 488:2-14',
    '2:18 -> 489:0',
    '2:4-18 -> 491:0-72',
    '2:4 -> 492:0',
    '2:4-18 -> 493:2-15',
    '2:18 -> 494:0',
  ])
})

test('utilities have source maps', async () => {
  let config = {
    content: [{ raw: `text-red-500` }],
  }

  let input = css`
    @tailwind utilities;
  `

  let result = await run(input, config)
  let { sources, annotations } = parseSourceMaps(result)

  // All CSS generated by Tailwind CSS should be annotated with source maps
  // And always be able to point to the original source file
  expect(sources).not.toContain('<no source>')
  expect(sources.length).toBe(1)

  expect(annotations).toStrictEqual(['2:4 -> 1:0', '2:4-23 -> 2:4-24', '2:4 -> 3:4', '2:23 -> 4:0'])
})

test('components have source maps', async () => {
  let config = {
    content: [{ raw: `container` }],
  }

  let input = css`
    @tailwind components;
  `

  let result = await run(input, config)
  let { sources, annotations } = parseSourceMaps(result)

  // All CSS generated by Tailwind CSS should be annotated with source maps
  // And always be able to point to the original source file
  expect(sources).not.toContain('<no source>')
  expect(sources.length).toBe(1)

  expect(annotations).toEqual([
    '2:4 -> 1:0',
    '2:4 -> 2:4',
    '2:24 -> 3:0',
    '2:4 -> 4:0',
    '2:4 -> 5:4',
    '2:4 -> 6:8',
    '2:24 -> 7:4',
    '2:24 -> 8:0',
    '2:4 -> 9:0',
    '2:4 -> 10:4',
    '2:4 -> 11:8',
    '2:24 -> 12:4',
    '2:24 -> 13:0',
    '2:4 -> 14:0',
    '2:4 -> 15:4',
    '2:4 -> 16:8',
    '2:24 -> 17:4',
    '2:24 -> 18:0',
    '2:4 -> 19:0',
    '2:4 -> 20:4',
    '2:4 -> 21:8',
    '2:24 -> 22:4',
    '2:24 -> 23:0',
    '2:4 -> 24:0',
    '2:4 -> 25:4',
    '2:4 -> 26:8',
    '2:24 -> 27:4',
    '2:24 -> 28:0',
  ])
})

test('source maps for layer rules are not rewritten to point to @tailwind directives', async () => {
  let config = {
    content: [{ raw: `font-normal foo hover:foo lg:foo` }],
  }

  let utilitiesFile = postcss.parse(
    css`
      @tailwind utilities;
    `,
    { from: 'components.css', map: { prev: map } }
  )

  let mainCssFile = postcss.parse(
    css`
      @layer utilities {
        .foo {
          background-color: red;
        }
      }
    `,
    { from: 'input.css', map: { prev: map } }
  )

  // Just pretend that there's an @import in `mainCssFile` that imports the nodes from `utilitiesFile`
  let input = postcss.root({
    nodes: [...utilitiesFile.nodes, ...mainCssFile.nodes],
    source: mainCssFile.source,
  })

  let result = await run(input, config)

  let { sources, annotations } = parseSourceMaps(result)

  // All CSS generated by Tailwind CSS should be annotated with source maps
  // And always be able to point to the original source file
  expect(sources).not.toContain('<no source>')

  // And we should see that the source map for the layer rule is not rewritten
  // to point to the @tailwind directive but instead points to the original
  expect(sources.length).toBe(2)
  expect(sources).toEqual(['components.css', 'input.css'])

  expect(annotations).toEqual([
    '2:6 -> 1:0',
    '2:6 -> 2:10',
    '2:25 -> 3:0',
    '3:8 -> 4:8',
    '4:10-31 -> 5:10-31',
    '5:8 -> 6:8',
    '3:8 -> 7:8',
    '4:10-31 -> 8:10-31',
    '5:8 -> 9:8',
    '1:0 -> 10:8',
    '3:8 -> 11:8',
    '4:10-31 -> 12:10-31',
    '5:8 -> 13:8',
    '7:4 -> 14:0',
  ])
})
