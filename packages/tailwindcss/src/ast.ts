import { parseAtRule } from './css-parser'

const AT_SIGN = 0x40

export type Range = [start: number, end: number]

/**
 * Represents a range in a source file or string and the range in the
 * transformed output.
 *
 * e.g. `src` represents the original source position and `dst` represents the
 * transformed position after reprinting.
 *
 * These numbers are indexes into the source code rather than line/column
 * numbers. We compute line/column numbers lazily only when generating
 * source maps.
 */
export interface Offsets {
  src: Range
  dst: Range | null
}

export type StyleRule = {
  kind: 'rule'
  selector: string
  nodes: AstNode[]

  offsets: {
    /** The bounds of the rule's selector */
    selector?: Offsets

    /** The bounds of the rule's body including the braces */
    body?: Offsets
  }
}

export type AtRule = {
  kind: 'at-rule'
  name: string
  params: string
  nodes: AstNode[]

  offsets: {
    /** The bounds of the rule's name */
    name?: Offsets

    /** The bounds of the rule's params */
    params?: Offsets

    /** The bounds of the rule's body including the braces */
    body?: Offsets
  }
}

export type Declaration = {
  kind: 'declaration'
  property: string
  value: string | undefined
  important: boolean

  offsets: {
    /** The bounds of the property name */
    property?: Offsets

    /** The bounds of the property value */
    value?: Offsets
  }
}

export type Comment = {
  kind: 'comment'
  value: string

  offsets: {
    /** The bounds of the comment itself including open/close characters */
    value?: Offsets
  }
}

export type Context = {
  kind: 'context'
  context: Record<string, string | boolean>
  nodes: AstNode[]

  offsets: {
    /**
     * The bounds of the "body"
     *
     * Since imports expand into context nodes this can, for example, represent
     * the bounds of an entire `@import` rule.
     */
    body?: Offsets
  }
}

export type AtRoot = {
  kind: 'at-root'
  nodes: AstNode[]

  offsets: {
    /** The bounds of the rule's body */
    body?: Offsets
  }
}

export type Rule = StyleRule | AtRule
export type AstNode = StyleRule | AtRule | Declaration | Comment | Context | AtRoot

export function styleRule(selector: string, nodes: AstNode[] = []): StyleRule {
  return {
    kind: 'rule',
    selector,
    nodes,
    offsets: {},
  }
}

export function atRule(name: string, params: string = '', nodes: AstNode[] = []): AtRule {
  return {
    kind: 'at-rule',
    name,
    params,
    nodes,
    offsets: {},
  }
}

export function rule(selector: string, nodes: AstNode[] = []): StyleRule | AtRule {
  if (selector.charCodeAt(0) === AT_SIGN) {
    return parseAtRule(selector, nodes)
  }

  return styleRule(selector, nodes)
}

export function decl(property: string, value: string | undefined, important = false): Declaration {
  return {
    kind: 'declaration',
    property,
    value,
    important,
    offsets: {},
  }
}

export function comment(value: string): Comment {
  return {
    kind: 'comment',
    value: value,
    offsets: {},
  }
}

export function context(context: Record<string, string | boolean>, nodes: AstNode[]): Context {
  return {
    kind: 'context',
    context,
    nodes,
    offsets: {},
  }
}

export function atRoot(nodes: AstNode[]): AtRoot {
  return {
    kind: 'at-root',
    nodes,
    offsets: {},
  }
}

export const enum WalkAction {
  /** Continue walking, which is the default */
  Continue,

  /** Skip visiting the children of this node */
  Skip,

  /** Stop the walk entirely */
  Stop,
}

export function walk(
  ast: AstNode[],
  visit: (
    node: AstNode,
    utils: {
      parent: AstNode | null
      replaceWith(newNode: AstNode | AstNode[]): void
      context: Record<string, string | boolean>
      path: AstNode[]
    },
  ) => void | WalkAction,
  path: AstNode[] = [],
  context: Record<string, string | boolean> = {},
) {
  for (let i = 0; i < ast.length; i++) {
    let node = ast[i]
    let parent = path[path.length - 1] ?? null

    // We want context nodes to be transparent in walks. This means that
    // whenever we encounter one, we immediately walk through its children and
    // furthermore we also don't update the parent.
    if (node.kind === 'context') {
      if (walk(node.nodes, visit, path, { ...context, ...node.context }) === WalkAction.Stop) {
        return WalkAction.Stop
      }
      continue
    }

    path.push(node)
    let status =
      visit(node, {
        parent,
        context,
        path,
        replaceWith(newNode) {
          if (Array.isArray(newNode)) {
            if (newNode.length === 0) {
              ast.splice(i, 1)
            } else if (newNode.length === 1) {
              ast[i] = newNode[0]
            } else {
              ast.splice(i, 1, ...newNode)
            }
          } else {
            ast[i] = newNode
          }

          // We want to visit the newly replaced node(s), which start at the
          // current index (i). By decrementing the index here, the next loop
          // will process this position (containing the replaced node) again.
          i--
        },
      }) ?? WalkAction.Continue
    path.pop()

    // Stop the walk entirely
    if (status === WalkAction.Stop) return WalkAction.Stop

    // Skip visiting the children of this node
    if (status === WalkAction.Skip) continue

    if (node.kind === 'rule' || node.kind === 'at-rule') {
      path.push(node)
      let result = walk(node.nodes, visit, path, context)
      path.pop()

      if (result === WalkAction.Stop) {
        return WalkAction.Stop
      }
    }
  }
}

// This is a depth-first traversal of the AST
export function walkDepth(
  ast: AstNode[],
  visit: (
    node: AstNode,
    utils: {
      parent: AstNode | null
      path: AstNode[]
      context: Record<string, string | boolean>
      replaceWith(newNode: AstNode[]): void
    },
  ) => void,
  path: AstNode[] = [],
  context: Record<string, string | boolean> = {},
) {
  for (let i = 0; i < ast.length; i++) {
    let node = ast[i]
    let parent = path[path.length - 1] ?? null

    if (node.kind === 'rule' || node.kind === 'at-rule') {
      path.push(node)
      walkDepth(node.nodes, visit, path, context)
      path.pop()
    } else if (node.kind === 'context') {
      walkDepth(node.nodes, visit, path, { ...context, ...node.context })
      continue
    }

    path.push(node)
    visit(node, {
      parent,
      context,
      path,
      replaceWith(newNode) {
        if (Array.isArray(newNode)) {
          if (newNode.length === 0) {
            ast.splice(i, 1)
          } else if (newNode.length === 1) {
            ast[i] = newNode[0]
          } else {
            ast.splice(i, 1, ...newNode)
          }
        } else {
          ast[i] = newNode
        }

        // Skip over the newly inserted nodes (being depth-first it doesn't make sense to visit them)
        i += newNode.length - 1
      },
    })
    path.pop()
  }
}

// Optimize the AST for printing where all the special nodes that require custom
// handling are handled such that the printing is a 1-to-1 transformation.
export function optimizeAst(ast: AstNode[]) {
  let atRoots: AstNode[] = []
  let seenAtProperties = new Set<string>()
  let propertyFallbacksRoot: Declaration[] = []
  let propertyFallbacksUniversal: Declaration[] = []

  function transform(
    node: AstNode,
    parent: Extract<AstNode, { nodes: AstNode[] }>['nodes'],
    depth = 0,
  ) {
    // Declaration
    if (node.kind === 'declaration') {
      if (node.property === '--tw-sort' || node.value === undefined || node.value === null) {
        return
      }
      parent.push(node)
    }

    // Rule
    else if (node.kind === 'rule') {
      let copy = { ...node, nodes: [] }
      for (let child of node.nodes) {
        transform(child, copy.nodes, depth + 1)
      }
      parent.push(copy)
    }

    // AtRule `@property`
    else if (node.kind === 'at-rule' && node.name === '@property' && depth === 0) {
      // Don't output duplicate `@property` rules
      if (seenAtProperties.has(node.params)) {
        return
      }

      // Collect fallbacks for `@property` rules for Firefox support
      // We turn these into rules on `:root` or `*` and some pseudo-elements
      // based on the value of `inherits``
      let property = node.params
      let initialValue = null
      let inherits = false

      for (let prop of node.nodes) {
        if (prop.kind !== 'declaration') continue
        if (prop.property === 'initial-value') {
          initialValue = prop.value
        } else if (prop.property === 'inherits') {
          inherits = prop.value === 'true'
        }
      }

      if (inherits) {
        propertyFallbacksRoot.push(decl(property, initialValue ?? 'initial'))
      } else {
        propertyFallbacksUniversal.push(decl(property, initialValue ?? 'initial'))
      }

      seenAtProperties.add(node.params)

      let copy = { ...node, nodes: [] }
      for (let child of node.nodes) {
        transform(child, copy.nodes, depth + 1)
      }
      parent.push(copy)
    }

    // AtRule
    else if (node.kind === 'at-rule') {
      let copy = { ...node, nodes: [] }
      for (let child of node.nodes) {
        transform(child, copy.nodes, depth + 1)
      }
      parent.push(copy)
    }

    // AtRoot
    else if (node.kind === 'at-root') {
      for (let child of node.nodes) {
        let newParent: AstNode[] = []
        transform(child, newParent, 0)
        for (let child of newParent) {
          atRoots.push(child)
        }
      }
    }

    // Context
    else if (node.kind === 'context') {
      // Remove reference imports from printing
      if (node.context.reference) {
        return
      }

      for (let child of node.nodes) {
        transform(child, parent, depth)
      }
    }

    // Comment
    else if (node.kind === 'comment') {
      parent.push(node)
    }

    // Unknown
    else {
      node satisfies never
    }
  }

  let newAst: AstNode[] = []
  for (let node of ast) {
    transform(node, newAst, 0)
  }

  // Fallbacks
  {
    let fallbackAst = []

    if (propertyFallbacksRoot.length > 0) {
      fallbackAst.push(rule(':root', propertyFallbacksRoot))
    }

    if (propertyFallbacksUniversal.length > 0) {
      fallbackAst.push(rule('*, ::before, ::after, ::backdrop', propertyFallbacksUniversal))
    }

    if (fallbackAst.length > 0) {
      newAst.push(
        atRule('@supports', '(-moz-orient: inline)', [atRule('@layer', 'base', fallbackAst)]),
      )
    }
  }

  return newAst.concat(atRoots)
}

export function toCss(ast: AstNode[], track?: boolean) {
  let pos = 0

  function span(value: string) {
    let range: Range = [pos, pos + value.length]

    pos += value.length

    return range
  }

  function stringify(node: AstNode, depth = 0): string {
    let css = ''
    let indent = '  '.repeat(depth)

    // Declaration
    if (node.kind === 'declaration') {
      css += `${indent}${node.property}: ${node.value}${node.important ? ' !important' : ''};\n`

      if (track) {
        // indent
        pos += indent.length

        // node.property
        if (node.offsets.property) {
          node.offsets.property.dst = span(node.property)
        }

        // `: `
        pos += 2

        // node.value
        if (node.offsets.value) {
          node.offsets.value.dst = span(node.value!)
        }

        // !important
        if (node.important) {
          pos += 11
        }

        // `;\n`
        pos += 2
      }
    }

    // Rule
    else if (node.kind === 'rule') {
      css += `${indent}${node.selector} {\n`

      if (track) {
        // indent
        pos += indent.length

        // node.selector
        if (node.offsets.selector) {
          node.offsets.selector.dst = span(node.selector)
        }

        // ` `
        pos += 1

        // `{`
        if (track && node.offsets.body) {
          node.offsets.body.dst = span(`{`)
        }

        // `\n`
        pos += 1
      }

      for (let child of node.nodes) {
        css += stringify(child, depth + 1)
      }

      css += `${indent}}\n`

      if (track) {
        // indent
        pos += indent.length

        // `}`
        if (node.offsets.body?.dst) {
          node.offsets.body.dst[1] = span(`}`)[1]
        }

        // `\n`
        pos += 1
      }
    }

    // AtRule
    else if (node.kind === 'at-rule') {
      // Print at-rules without nodes with a `;` instead of an empty block.
      //
      // E.g.:
      //
      // ```css
      // @layer base, components, utilities;
      // ```
      if (node.nodes.length === 0) {
        let css = `${indent}${node.name} ${node.params};\n`

        if (track) {
          // indent
          pos += indent.length

          // node.name
          if (node.offsets.name) {
            node.offsets.name.dst = span(node.name)
          }

          // ` `
          pos += 1

          // node.params
          if (node.offsets.params) {
            node.offsets.params.dst = span(node.params)
          }

          // `;\n`
          pos += 2
        }

        return css
      }

      css += `${indent}${node.name}${node.params ? ` ${node.params} ` : ' '}{\n`

      if (track) {
        // indent
        pos += indent.length

        // node.name
        if (node.offsets.name) {
          node.offsets.name.dst = span(node.name)
        }

        if (node.params) {
          // ` `
          pos += 1

          // node.params
          if (node.offsets.params) {
            node.offsets.params.dst = span(node.params)
          }
        }

        // ` `
        pos += 1

        // `{`
        if (track && node.offsets.body) {
          node.offsets.body.dst = span(`{`)
        }

        // `\n`
        pos += 1
      }

      for (let child of node.nodes) {
        css += stringify(child, depth + 1)
      }

      css += `${indent}}\n`

      if (track) {
        // indent
        pos += indent.length

        // `}`
        if (node.offsets.body?.dst) {
          node.offsets.body.dst[1] = span(`}`)[1]
        }

        // `\n`
        pos += 1
      }
    }

    // Comment
    else if (node.kind === 'comment') {
      css += `${indent}/*${node.value}*/\n`

      if (track) {
        // indent
        pos += indent.length

        // The comment itself. We do this instead of just the inside because
        // it seems more useful to have the entire comment span tracked.
        if (node.offsets.value) {
          node.offsets.value.dst = span(`/*${node.value}*/`)
        }

        // `\n`
        pos += 1
      }
    }

    // These should've been handled already by `optimizeAst` which
    // means we can safely ignore them here. We return an empty string
    // immediately to signal that something went wrong.
    else if (node.kind === 'context' || node.kind === 'at-root') {
      return ''
    }

    // Unknown
    else {
      node satisfies never
    }

    return css
  }

  let css = ''

  for (let node of ast) {
    css += stringify(node, 0)
  }

  return css
}
