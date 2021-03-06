const isClass = v => typeof v === 'function' && v.toString().match(/^\s*class\s+/)

const unifyBy = by => {
  if (typeof by === 'string') return [[by, i => i[by]]]
  if (Array.isArray(by)) {
    return by.map(key => [key, i => i[key]])
  }

  return Object.entries(by).map(([key, fn]) => [key, fn])
}

class SlickArray extends Array {
  constructor(...args) {
    let config = args.pop()
    if (typeof config !== 'object' || Array.isArray(config)) {
      if (config) {
        args.push(config)
      }
      config = {}
    }

    const {
      by,
      that,
      items = [],
      as, // optional constructor for new items
    } = config

    // prepend normal array stuff
    if (args.length) {
      if (args.length > 1) {
        items.unshift(...args)
      } else {
        items.unshift(...Array(...args))
      }
    }

    super()

    // public
    this.$ = {}

    if (by) {
      this.$.by = unifyBy(by)
      this.by = {}
    }

    if (as) {
      this.$.as = isClass(as) ? i => new as(i) : as
    }

    if (that) {
      this.that = {}
      this.$.that = that

      for (const group in that) {
        this.that[group] = []
      }
    }

    if (items.length) {
      this.add(...items)
    }
  }

  // ADDED FUNCTIONS mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm

  add(...items) {
    Reflect.apply(this.push, this, items)

    return items.length > 1 ? items : items[0]
  }

  remove(...items) {
    let index
    for (const item of items) {
      while ((index = this.indexOf(item)) !== -1) {
        super.splice(index, 1)
        this.unindex(item)
      }
    }

    return items.length > 1 ? items : items[0]
  }


  // EXTENDED FUNCTIONS mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm

  pop() {
    const item = super.pop()

    return this.unindex(item)
  }

  push(...items) {
    // items = Reflect.apply(this.index, this, items)

    return super.push(...items)
  }

  shift() {
    const item = super.shift()

    return this.unindex(item)
  }

  splice(...args) {
    const items = super.splice(...args)

    return Array.from(this.unindex(items))
  }

  unshift(...items) {
    items = Reflect.apply(this.index, this, items)

    return super.unshift(...items)
  }

  // INTERNAL FUNCTIONS mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm

  index(...items) {
    if (!this.$.by && !this.$.that && !this.$.as) return items

    return items
    // return items.map(item => {
    //   item = this.$.as ? this.$.as(item) : item

    //   // maps
    //   if (this.$.by) {
    //     for (const [path, fn] of this.$.by) {
    //       const key = fn(item)

    //       if (!this.by[path]) {
    //         this.by[path] = {}
    //       }

    //       this.by[path][key] = item
    //     }
    //   }

    //    // that
    //   if (this.$.that) {
    //     for (const path in this.$.that) {
    //       const key = this.$.that[path](item)

    //       if (!key) continue

    //       if (typeof key === 'string') {
    //         (this.that[path][key] = this.that[path][key] || []).push(item)
    //       } else {
    //         this.that[path].push(item)
    //       }
    //     }
    //   }

    //   return item
    // })
  }

  unindex(item) {
    // maps
    if (this.$.by) {
      for (const [path, fn] of this.$.by) {
        const key = fn(item)
        Reflect.deleteProperty(this.by[path], key)
      }
    }

    // that
    if (this.$.that) {
      for (const [path, fn] of Object.entries(this.$.that || {})) {
        const key = fn(item)

        if (key) {
          if (typeof key === 'string') { // dump into group
            const index = this.that[path][key].indexOf(item)
            this.that[path][key].splice(index, 1)
          } else {
            const index = this.that[path].indexOf(item)
            this.that[path].splice(index, 1)
          }
        }
      }
    }

    return item
  }
}

module.exports = { SlickArray }
