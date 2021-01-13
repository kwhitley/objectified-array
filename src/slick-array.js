const isClass = v => typeof v === 'function' && v.toString().match(/^\s*class\s+/)

const unifyBy = by => {
  if (typeof by === 'string') return { [by]: i => i[by] }
  if (Array.isArray(by)) return by.reduce((acc, key) => (acc[key] = i => i[key]) && acc, {})

  return by
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
      groupBy,
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
    this.by = {}

    if (by) {
      this.$.by = unifyBy(by)
      // this.by = {}

      for (const group in this.$.by) {
        this.by[group] = {}
      }
    }

    if (as) {
      this.$.as = isClass(as) ? i => new as(i) : as
    }

    if (groupBy) {
      this.$.groupBy = unifyBy(groupBy)
      // this.by = this.by || {}

      for (const group in this.$.groupBy) {
        this.by[group] = []
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
    items = Reflect.apply(this.index, this, items)

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
    if (!this.$.by && !this.$.groupBy && !this.$.as) return items
    // if (!(this.$.by || this.$.groupBy || this.$.as)) return items

    const max = items.length

    for (let i=max-1; i>=0; i--) {
      if (this.$.as) {
        items[i] = this.$.as(items[i])
      }
      const item = items[i]

      // maps
      if (this.$.by) {
        for (const path in this.$.by) {
          const key = this.$.by[path](item)
          this.by[path][key] = item
        }
      }

       // groupBy
      if (this.$.groupBy) {
        for (const path in this.$.groupBy) {
          const key = this.$.groupBy[path](item)

          if (!key) continue

          if (typeof key === 'string') {
            (this.by[path][key] = this.by[path][key] || []).push(item)
          } else {
            this.by[path].push(item)
          }
        }
      }
    }

    return items
  }

  unindex(item) {
    // maps
    if (this.$.by) {
      for (const path in this.$.by) {
        const key = this.$.by[path](item)
        Reflect.deleteProperty(this.by[path], key)
      }
    }

    // groupBy
    if (this.$.groupBy) {
      for (const [path, fn] of Object.entries(this.$.groupBy || {})) {
        const key = fn(item)

        if (key) {
          if (typeof key === 'string') { // dump into group
            const index = this.by[path][key].indexOf(item)
            this.by[path][key].splice(index, 1)
          } else {
            const index = this.by[path].indexOf(item)
            this.by[path].splice(index, 1)
          }
        }
      }
    }

    return item
  }
}

module.exports = { SlickArray }