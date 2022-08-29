(async function() { ////////////////////////////////////////////////////

  const $ = document.querySelector.bind(document)
  const $$ = document.querySelectorAll.bind(document)
  const debounce = (ms, f) => { let t; return (...args) => {
    clearTimeout(t); t = setTimeout(() => {f.apply(null, args)}, ms) }}
  Element.prototype.attr = function(k,v) {
    return this[`${v ? 'set' : v===null ? 'remove' : 'get'}Attribute`](k,v)}

  //////////////////////////////////////////////////////////////////////

  const kuCODE        =  0
      , kuNAME        =  1
      , kuCATEGORY    =  2
      , kuCOMB_CLASS  =  3
      , kuBIDI_CLASS  =  4
      , kuDECOMP      =  5
      , kuDECIMAL     =  6
      , kuDIGIT       =  7
      , kuNUMERIC     =  8
      , kuBIDI_MIRROR =  9
      , kuUNI1NAME    = 10
      , kuCOMMENT     = 11
      , kuUPPER       = 12
      , kuLOWER       = 13
      , kuTITLE       = 14

  const kI    = 0
      , kD    = 1
      , kENT  = 2
      , kNAME = 3

  const CTRL = '<control>'


  const NCOLS = 20

  let alluni, blockuni, uni

  let vw, vh
  let cw, ch

  let nrows, totheight 

  const docelem = document.documentElement

  async function init() {
    const resp = await fetch('UnicodeData.txt')
    const text = await resp.text()
    alluni = text.split('\n')
    const ulen = alluni.length
    for (let i=0; i < ulen; ++i) {
      // TODO: we could precalculate all of this
      const c = alluni[i].split(';')
      const isctrl = c[1] && c[1][0]=='<'
      const ent = isctrl ? ' ' : `&#x${c[0]}`
      const name = isctrl ? c[kuUNI1NAME] : c[kuNAME]
      const dec = parseInt(c[kuCODE], 16)
      alluni[i] = [i, dec, ent, name]
    }
    uni = blockuni = alluni
    set_sizes()
  }

  function set_sizes() {
    vw = docelem.clientWidth
    vh = docelem.clientHeight
    cw = cells.firstElementChild.offsetWidth
    ch = cells.firstElementChild.offsetHeight
    nrows = Math.ceil(vh/ch)
    reset()
  }

  function reset() {
    totheight = ch * Math.ceil(uni.length / NCOLS)
    cells_wrapper.style.height = `${totheight + 80}px`
    let h = ''
    const ncells = (nrows+1)*NCOLS
    for (let i=0; i < ncells; ++i) { h+= '<pre class=cell> </pre>' }
    cells.innerHTML = h
  }

  function render() {
    if (!uni) { return }
    const y = Math.max(0, window.scrollY)
    const ulen = uni.length
    const firstrow = Math.floor(y/ch)
    const firstcell = firstrow * NCOLS
    const lastrow = firstrow + nrows + 1
//    const lastcell = Math.min(ulen, lastrow * NCOLS)
    const lastcell = lastrow * NCOLS
    const ty = firstrow * ch
    const pres = cells.children
    for (let i=firstcell; i < lastcell; ++i) {
      const p = i-firstcell
      const pre = pres[p]
      if (p < ulen) {
        const c = uni[i]
        pre.idx = c[kI]
        pre.innerHTML = c[kENT]
        pre.removeAttribute('disabled')
      } else {
        pre.setAttribute('disabled', true)
        pre.innerHTML = ' '
      }
    }
    cells.style.transform = `translateY(${ty}px)`
  }

  function rerender() {
    window.onscroll = null
    window.scrollTop = 0
    scroll(0,0)
    reset()
    render()
    window.onscroll = render
  }

  function in_block(b) {
    const B = BLOCKS[parseInt(b, 10)]
    const min=B[0], max=B[1]
    return alluni.filter(c => ((min <= c[kD]) && (c[kD] <= max)))
  }

  function show_block() {
    searchq.value = ''
    const b = blocks.value
    if (b == 'x') {
      uni = blockuni = alluni
    } else {
      blockuni = in_block(b)
      uni = blockuni
    }
    rerender()
  }

  function filter() {
    const q = searchq.value.trim()
    const b = blocks.value
    if (q.length) {
      const re = new RegExp(q, 'i')
      uni = blockuni.filter(c => re.test(c[kNAME]))
    } else {
      uni = blockuni
    }
    rerender()
  }

  function show_info(elem) {
    const s = docelem.scrollTop
    const cr = elem.getBoundingClientRect()
    const cy = cr.y + s
    const i = elem.idx //parseInt(elem.attr('data-i'), 10)
    const c = alluni[i]
    info_rune.innerHTML = c[kENT]
    info_name.innerText = c[kNAME]
    let block = BLOCKS.find(b => ((b[0] <= i) && (i <= b[1])))
    info_block.innerText = block[2]
    info.className = 'show'
    const ir = info.getBoundingClientRect()
    const cright = cr.x + cr.width
    const ix = (cright + ir.width) <= vw ? cright : (cr.left - ir.width)
    const iy = Math.min(((vh+s) - ir.height), cy)
    info.style.transform = `translate(${ix|0}px, ${iy|0}px)`
  }

  window.hide_info = () => { info.className = '' }

  function copy_rune() {
    navigator.clipboard.writeText(info_rune.innerText)
      .then(() => {
        info_copied.className = 'show'
        setTimeout(() => {info_copied.className = ''}, 750)
      })

  }

  searchq.onfocus = hide_info
  searchq.oninput = debounce(100, filter)
  searchq.onkeypress = e => { (e.key == 'Enter') && e.target.blur() }
  blocks.onchange = show_block
  info_rune.onclick = copy_rune

  window.onscroll = render
  window.onresize = () => { set_sizes(); render(); }

  document.onclick = e => {
    if (e.target.className == 'cell') { show_info(e.target) }
  }

  document.onkeypress = e => {
    if (e.metaKey || (e.target.tagName == 'INPUT')) { return }
    event.preventDefault()
    if (e.key == '/') { searchq.focus() }
  }


  //////////////////////////////////////////////////////////////////////


  await init()
  render()


  //////////////////////////////////////////////////////////////////////

    const CATEGORIES = {
      Lu: "An uppercase letter",
      Ll: "A lowercase letter",
      Lt: "A digraphic character, with first part uppercase",
      Lm: "A modifier letter",
      Lo: "Other letters, including syllables and ideographs",
      Mn: "A nonspacing combining mark (zero advance width)",
      Mc: "A spacing combining mark (positive advance width)",
      Me: "An enclosing combining mark",
      Nd: "A decimal digit",
      Nl: "A letterlike numeric character",
      No: "A numeric character of other type",
      Pc: "A connecting punctuation mark, like a tie",
      Pd: "A dash or hyphen punctuation mark",
      Ps: "An opening punctuation mark (of a pair)",
      Pe: "A closing punctuation mark (of a pair)",
      Pi: "An initial quotation mark",
      Pf: "A final quotation mark",
      Po: "A punctuation mark of other type",
      Sm: "A symbol of mathematical use",
      Sc: "A currency sign",
      Sk: "A non-letterlike modifier symbol",
      So: "A symbol of other type",
      Zs: "A space character (of various non-zero widths)",
      Zl: "U+2028 LINE SEPARATOR only",
      Zp: "U+2029 PARAGRAPH SEPARATOR only",
      Cc: "A C0 or C1 control code",
      Cf: "A format control character",
      Cs: "A surrogate code point",
      Co: "A private-use character",
      Cn: "A reserved unassigned code point or a noncharacter"
    }


    const BLOCKS = [
      [0,127,'Basic Latin'],
      [128,255,'Latin-1 Supplement'],
      [256,383,'Latin Extended-A'],
      [384,591,'Latin Extended-B'],
      [592,687,'IPA Extensions'],
      [688,767,'Spacing Modifier Letters'],
      [768,879,'Combining Diacritical Marks'],
      [880,1023,'Greek and Coptic'],
      [1024,1279,'Cyrillic'],
      [1280,1327,'Cyrillic Supplement'],
      [1328,1423,'Armenian'],
      [1424,1535,'Hebrew'],
      [1536,1791,'Arabic'],
      [1792,1871,'Syriac'],
      [1872,1919,'Arabic Supplement'],
      [1920,1983,'Thaana'],
      [1984,2047,'NKo'],
      [2048,2111,'Samaritan'],
      [2112,2143,'Mandaic'],
      [2208,2303,'Arabic Extended-A'],
      [2304,2431,'Devanagari'],
      [2432,2559,'Bengali'],
      [2560,2687,'Gurmukhi'],
      [2688,2815,'Gujarati'],
      [2816,2943,'Oriya'],
      [2944,3071,'Tamil'],
      [3072,3199,'Telugu'],
      [3200,3327,'Kannada'],
      [3328,3455,'Malayalam'],
      [3456,3583,'Sinhala'],
      [3584,3711,'Thai'],
      [3712,3839,'Lao'],
      [3840,4095,'Tibetan'],
      [4096,4255,'Myanmar'],
      [4256,4351,'Georgian'],
      [4352,4607,'Hangul Jamo'],
      [4608,4991,'Ethiopic'],
      [4992,5023,'Ethiopic Supplement'],
      [5024,5119,'Cherokee'],
      [5120,5759,'Unified Canadian Aboriginal Syllabics'],
      [5760,5791,'Ogham'],
      [5792,5887,'Runic'],
      [5888,5919,'Tagalog'],
      [5920,5951,'Hanunoo'],
      [5952,5983,'Buhid'],
      [5984,6015,'Tagbanwa'],
      [6016,6143,'Khmer'],
      [6144,6319,'Mongolian'],
      [6320,6399,'Unified Canadian Aboriginal Syllabics Extended'],
      [6400,6479,'Limbu'],
      [6480,6527,'Tai Le'],
      [6528,6623,'New Tai Lue'],
      [6624,6655,'Khmer Symbols'],
      [6656,6687,'Buginese'],
      [6688,6831,'Tai Tham'],
      [6832,6911,'Combining Diacritical Marks Extended'],
      [6912,7039,'Balinese'],
      [7040,7103,'Sundanese'],
      [7104,7167,'Batak'],
      [7168,7247,'Lepcha'],
      [7248,7295,'Ol Chiki'],
      [7296,7311,'Cyrillic Extended-C'],
      [7360,7375,'Sundanese Supplement'],
      [7376,7423,'Vedic Extensions'],
      [7424,7551,'Phonetic Extensions'],
      [7552,7615,'Phonetic Extensions Supplement'],
      [7616,7679,'Combining Diacritical Marks Supplement'],
      [7680,7935,'Latin Extended Additional'],
      [7936,8191,'Greek Extended'],
      [8192,8303,'General Punctuation'],
      [8304,8351,'Superscripts and Subscripts'],
      [8352,8399,'Currency Symbols'],
      [8400,8447,'Combining Diacritical Marks for Symbols'],
      [8448,8527,'Letterlike Symbols'],
      [8528,8591,'Number Forms'],
      [8592,8703,'Arrows'],
      [8704,8959,'Mathematical Operators'],
      [8960,9215,'Miscellaneous Technical'],
      [9216,9279,'Control Pictures'],
      [9280,9311,'Optical Character Recognition'],
      [9312,9471,'Enclosed Alphanumerics'],
      [9472,9599,'Box Drawing'],
      [9600,9631,'Block Elements'],
      [9632,9727,'Geometric Shapes'],
      [9728,9983,'Miscellaneous Symbols'],
      [9984,10175,'Dingbats'],
      [10176,10223,'Miscellaneous Mathematical Symbols-A'],
      [10224,10239,'Supplemental Arrows-A'],
      [10240,10495,'Braille Patterns'],
      [10496,10623,'Supplemental Arrows-B'],
      [10624,10751,'Miscellaneous Mathematical Symbols-B'],
      [10752,11007,'Supplemental Mathematical Operators'],
      [11008,11263,'Miscellaneous Symbols and Arrows'],
      [11264,11359,'Glagolitic'],
      [11360,11391,'Latin Extended-C'],
      [11392,11519,'Coptic'],
      [11520,11567,'Georgian Supplement'],
      [11568,11647,'Tifinagh'],
      [11648,11743,'Ethiopic Extended'],
      [11744,11775,'Cyrillic Extended-A'],
      [11776,11903,'Supplemental Punctuation'],
      [11904,12031,'CJK Radicals Supplement'],
      [12032,12255,'Kangxi Radicals'],
      [12272,12287,'Ideographic Description Characters'],
      [12288,12351,'CJK Symbols and Punctuation'],
      [12352,12447,'Hiragana'],
      [12448,12543,'Katakana'],
      [12544,12591,'Bopomofo'],
      [12592,12687,'Hangul Compatibility Jamo'],
      [12688,12703,'Kanbun'],
      [12704,12735,'Bopomofo Extended'],
      [12736,12783,'CJK Strokes'],
      [12784,12799,'Katakana Phonetic Extensions'],
      [12800,13055,'Enclosed CJK Letters and Months'],
      [13056,13311,'CJK Compatibility'],
      [13312,19903,'CJK Unified Ideographs Extension A'],
      [19904,19967,'Yijing Hexagram Symbols'],
      [19968,40959,'CJK Unified Ideographs'],
      [40960,42127,'Yi Syllables'],
      [42128,42191,'Yi Radicals'],
      [42192,42239,'Lisu'],
      [42240,42559,'Vai'],
      [42560,42655,'Cyrillic Extended-B'],
      [42656,42751,'Bamum'],
      [42752,42783,'Modifier Tone Letters'],
      [42784,43007,'Latin Extended-D'],
      [43008,43055,'Syloti Nagri'],
      [43056,43071,'Common Indic Number Forms'],
      [43072,43135,'Phags-pa'],
      [43136,43231,'Saurashtra'],
      [43232,43263,'Devanagari Extended'],
      [43264,43311,'Kayah Li'],
      [43312,43359,'Rejang'],
      [43360,43391,'Hangul Jamo Extended-A'],
      [43392,43487,'Javanese'],
      [43488,43519,'Myanmar Extended-B'],
      [43520,43615,'Cham'],
      [43616,43647,'Myanmar Extended-A'],
      [43648,43743,'Tai Viet'],
      [43744,43775,'Meetei Mayek Extensions'],
      [43776,43823,'Ethiopic Extended-A'],
      [43824,43887,'Latin Extended-E'],
      [43888,43967,'Cherokee Supplement'],
      [43968,44031,'Meetei Mayek'],
      [44032,55215,'Hangul Syllables'],
      [55216,55295,'Hangul Jamo Extended-B'],
      [55296,56191,'High Surrogates'],
      [56192,56319,'High Private Use Surrogates'],
      [56320,57343,'Low Surrogates'],
      [57344,63743,'Private Use Area'],
      [63744,64255,'CJK Compatibility Ideographs'],
      [64256,64335,'Alphabetic Presentation Forms'],
      [64336,65023,'Arabic Presentation Forms-A'],
      [65024,65039,'Variation Selectors'],
      [65040,65055,'Vertical Forms'],
      [65056,65071,'Combining Half Marks'],
      [65072,65103,'CJK Compatibility Forms'],
      [65104,65135,'Small Form Variants'],
      [65136,65279,'Arabic Presentation Forms-B'],
      [65280,65519,'Halfwidth and Fullwidth Forms'],
      [65520,65535,'Specials'],
      [65536,65663,'Linear B Syllabary'],
      [65664,65791,'Linear B Ideograms'],
      [65792,65855,'Aegean Numbers'],
      [65856,65935,'Ancient Greek Numbers'],
      [65936,65999,'Ancient Symbols'],
      [66000,66047,'Phaistos Disc'],
      [66176,66207,'Lycian'],
      [66208,66271,'Carian'],
      [66272,66303,'Coptic Epact Numbers'],
      [66304,66351,'Old Italic'],
      [66352,66383,'Gothic'],
      [66384,66431,'Old Permic'],
      [66432,66463,'Ugaritic'],
      [66464,66527,'Old Persian'],
      [66560,66639,'Deseret'],
      [66640,66687,'Shavian'],
      [66688,66735,'Osmanya'],
      [66736,66815,'Osage'],
      [66816,66863,'Elbasan'],
      [66864,66927,'Caucasian Albanian'],
      [67072,67455,'Linear A'],
      [67584,67647,'Cypriot Syllabary'],
      [67648,67679,'Imperial Aramaic'],
      [67680,67711,'Palmyrene'],
      [67712,67759,'Nabataean'],
      [67808,67839,'Hatran'],
      [67840,67871,'Phoenician'],
      [67872,67903,'Lydian'],
      [67968,67999,'Meroitic Hieroglyphs'],
      [68000,68095,'Meroitic Cursive'],
      [68096,68191,'Kharoshthi'],
      [68192,68223,'Old South Arabian'],
      [68224,68255,'Old North Arabian'],
      [68288,68351,'Manichaean'],
      [68352,68415,'Avestan'],
      [68416,68447,'Inscriptional Parthian'],
      [68448,68479,'Inscriptional Pahlavi'],
      [68480,68527,'Psalter Pahlavi'],
      [68608,68687,'Old Turkic'],
      [68736,68863,'Old Hungarian'],
      [69216,69247,'Rumi Numeral Symbols'],
      [69632,69759,'Brahmi'],
      [69760,69839,'Kaithi'],
      [69840,69887,'Sora Sompeng'],
      [69888,69967,'Chakma'],
      [69968,70015,'Mahajani'],
      [70016,70111,'Sharada'],
      [70112,70143,'Sinhala Archaic Numbers'],
      [70144,70223,'Khojki'],
      [70272,70319,'Multani'],
      [70320,70399,'Khudawadi'],
      [70400,70527,'Grantha'],
      [70656,70783,'Newa'],
      [70784,70879,'Tirhuta'],
      [71040,71167,'Siddham'],
      [71168,71263,'Modi'],
      [71264,71295,'Mongolian Supplement'],
      [71296,71375,'Takri'],
      [71424,71487,'Ahom'],
      [71840,71935,'Warang Citi'],
      [72384,72447,'Pau Cin Hau'],
      [72704,72815,'Bhaiksuki'],
      [72816,72895,'Marchen'],
      [73728,74751,'Cuneiform'],
      [74752,74879,'Cuneiform Numbers and Punctuation'],
      [74880,75087,'Early Dynastic Cuneiform'],
      [77824,78895,'Egyptian Hieroglyphs'],
      [82944,83583,'Anatolian Hieroglyphs'],
      [92160,92735,'Bamum Supplement'],
      [92736,92783,'Mro'],
      [92880,92927,'Bassa Vah'],
      [92928,93071,'Pahawh Hmong'],
      [93952,94111,'Miao'],
      [94176,94207,'Ideographic Symbols and Punctuation'],
      [94208,100351,'Tangut'],
      [100352,101119,'Tangut Components'],
      [110592,110847,'Kana Supplement'],
      [113664,113823,'Duployan'],
      [113824,113839,'Shorthand Format Controls'],
      [118784,119039,'Byzantine Musical Symbols'],
      [119040,119295,'Musical Symbols'],
      [119296,119375,'Ancient Greek Musical Notation'],
      [119552,119647,'Tai Xuan Jing Symbols'],
      [119648,119679,'Counting Rod Numerals'],
      [119808,120831,'Mathematical Alphanumeric Symbols'],
      [120832,121519,'Sutton SignWriting'],
      [122880,122927,'Glagolitic Supplement'],
      [124928,125151,'Mende Kikakui'],
      [125184,125279,'Adlam'],
      [126464,126719,'Arabic Mathematical Alphabetic Symbols'],
      [126976,127023,'Mahjong Tiles'],
      [127024,127135,'Domino Tiles'],
      [127136,127231,'Playing Cards'],
      [127232,127487,'Enclosed Alphanumeric Supplement'],
      [127488,127743,'Enclosed Ideographic Supplement'],
      [127744,128511,'Miscellaneous Symbols and Pictographs'],
      [128512,128591,'Emoticons'],
      [128592,128639,'Ornamental Dingbats'],
      [128640,128767,'Transport and Map Symbols'],
      [128768,128895,'Alchemical Symbols'],
      [128896,129023,'Geometric Shapes Extended'],
      [129024,129279,'Supplemental Arrows-C'],
      [129280,129535,'Supplemental Symbols and Pictographs'],
      [131072,173791,'CJK Unified Ideographs Extension B'],
      [173824,177983,'CJK Unified Ideographs Extension C'],
      [177984,178207,'CJK Unified Ideographs Extension D'],
      [178208,183983,'CJK Unified Ideographs Extension E'],
      [194560,195103,'CJK Compatibility Ideographs Supplement'],
      [917504,917631,'Tags'],
      [917760,917999,'Variation Selectors Supplement'],
      [983040,1048575,'Supplementary Private Use Area-A'],
      [1048576,1114111,'Supplementary Private Use Area-B'],
    ]

    const blen = BLOCKS.length
    for (let i=0; i < blen; ++i) {
      blocks.innerHTML += `<option value=${i}>${BLOCKS[i][2]}</option>`
    }


})() ///////////////////////////////////////////////////////////////////
