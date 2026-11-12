/**
 * GrievanceTrack - Custom Relational SQL Engine (Pure JavaScript)
 * Zero-dependency, offline in-browser relational database parser & executor.
 * Supports: CREATE TABLE, DROP TABLE, INSERT, UPDATE, DELETE, SELECT (JOIN, WHERE, GROUP BY, ORDER BY, Aggregates)
 * Enforces: PRIMARY KEY, FOREIGN KEY (CASCADE/SET NULL), UNIQUE, NOT NULL, CHECK constraints.
 */

class SQLEngine {
  constructor() {
    this.tables = {};
    this.tableAutoInc = {};
  }

  // Tokenize SQL with quote-safety
  tokenize(sql) {
    const tokens = [];
    let current = '';
    let inQuote = null;
    let escape = false;

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      if (escape) {
        current += char;
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (inQuote) {
        if (char === inQuote) {
          inQuote = null;
          tokens.push(current);
          current = '';
        } else {
          current += char;
        }
      } else {
        if (char === "'" || char === '"' || char === '`') {
          inQuote = char;
        } else if (/\s/.test(char)) {
          if (current.length) { tokens.push(current); current = ''; }
        } else if ([',', '(', ')', ';'].includes(char)) {
          if (current.length) { tokens.push(current); current = ''; }
          tokens.push(char);
        } else {
          current += char;
        }
      }
    }
    if (current.length) tokens.push(current);
    return tokens;
  }

  // Replace '?' parameters with values
  injectParams(sql, params = []) {
    if (!params || !params.length) return sql;
    let pIdx = 0;
    let inQuote = false;
    let out = '';
    for (let i = 0; i < sql.length; i++) {
      const c = sql[i];
      if (c === "'" || c === '"') inQuote = !inQuote;
      if (c === '?' && !inQuote) {
        const val = params[pIdx++];
        if (val === null || val === undefined) out += 'NULL';
        else if (typeof val === 'number') out += val;
        else out += `'${String(val).replace(/'/g, "''")}'`;
      } else {
        out += c;
      }
    }
    return out;
  }

  // Execute DDL / DML (CREATE, DROP, INSERT, UPDATE, DELETE)
  execute(sql, params = []) {
    sql = this.injectParams(sql.trim(), params);
    // Split into individual statements if multi-statement script
    const statements = sql.split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/).map(s => s.trim()).filter(Boolean);
    let lastResult = { success: true, changes: 0 };
    for (const stmt of statements) {
      lastResult = this.executeSingle(stmt);
    }
    return lastResult;
  }

  executeSingle(sql) {
    const clean = sql.replace(/\s+/g, ' ').trim().replace(/;+\s*$/, '');
    if (/^CREATE\s+TABLE/i.test(clean)) return this.execCreateTable(clean);
    if (/^DROP\s+TABLE/i.test(clean)) return this.execDropTable(clean);
    if (/^INSERT\s+INTO/i.test(clean)) return this.execInsert(clean);
    if (/^UPDATE/i.test(clean)) return this.execUpdate(clean);
    if (/^DELETE\s+FROM/i.test(clean)) return this.execDelete(clean);
    throw new Error(`Unsupported SQL execution statement: ${sql}`);
  }

  execCreateTable(sql) {
    const match = sql.match(/^CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)$/i);
    if (!match) throw new Error(`Invalid CREATE TABLE syntax: ${sql}`);
    const tableName = match[1].toLowerCase();
    if (this.tables[tableName] && /IF\s+NOT\s+EXISTS/i.test(sql)) {
      return { success: true, changes: 0, tableName };
    }

    const body = match[2];
    const colDefs = [];
    const foreignKeys = [];
    let primaryKey = null;

    // Split column definitions respecting parentheses
    const parts = [];
    let depth = 0, current = '';
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      if (c === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    if (current.trim()) parts.push(current.trim());

    for (const part of parts) {
      if (/^PRIMARY\s+KEY\s*\(([^)]+)\)/i.test(part)) {
        primaryKey = part.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i)[1].trim().toLowerCase();
        continue;
      }
      if (/^FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i.test(part)) {
        const m = part.match(/^FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|SET\s+NULL))?/i);
        foreignKeys.push({
          column: m[1].trim().toLowerCase(),
          targetTable: m[2].trim().toLowerCase(),
          targetCol: m[3].trim().toLowerCase(),
          onDelete: m[4] ? m[4].toUpperCase().replace(/\s+/, ' ') : 'NO ACTION'
        });
        continue;
      }

      // Column spec
      const words = part.split(/\s+/);
      const colName = words[0].toLowerCase();
      const colType = (words[1] || 'TEXT').toUpperCase();
      const isPk = /PRIMARY\s+KEY/i.test(part);
      const isAuto = /AUTOINCREMENT/i.test(part);
      const notNull = /NOT\s+NULL/i.test(part) || isPk;
      const unique = /UNIQUE/i.test(part) || isPk;

      let checkFn = null;
      const checkMatch = part.match(/CHECK\s*\(([\s\S]+)\)/i);
      if (checkMatch) {
        checkFn = this.buildCheckEvaluator(colName, checkMatch[1]);
      }

      let defaultVal = null;
      const defMatch = part.match(/DEFAULT\s+([^,)]+)/i);
      if (defMatch) {
        defaultVal = this.parseLiteral(defMatch[1].trim());
      }

      const refMatch = part.match(/REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|SET\s+NULL))?/i);
      if (refMatch) {
        foreignKeys.push({
          column: colName,
          targetTable: refMatch[1].trim().toLowerCase(),
          targetCol: refMatch[2].trim().toLowerCase(),
          onDelete: refMatch[3] ? refMatch[3].toUpperCase().replace(/\s+/, ' ') : 'NO ACTION'
        });
      }

      if (isPk) primaryKey = colName;

      colDefs.push({
        name: colName,
        type: colType,
        isPk,
        isAuto,
        notNull,
        unique,
        defaultVal,
        checkFn,
        rawDef: part
      });
    }

    this.tables[tableName] = {
      name: tableName,
      columns: colDefs,
      primaryKey: primaryKey || (colDefs[0] ? colDefs[0].name : null),
      foreignKeys,
      rows: []
    };
    this.tableAutoInc[tableName] = 0;
    return { success: true, changes: 0, tableName };
  }

  execDropTable(sql) {
    const m = sql.match(/^DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
    if (!m) throw new Error(`Invalid DROP TABLE: ${sql}`);
    const name = m[1].toLowerCase();
    delete this.tables[name];
    delete this.tableAutoInc[name];
    return { success: true, changes: 1, tableName: name };
  }

  execInsert(sql) {
    const m = sql.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)(?:\s*\(([^)]+)\))?\s+VALUES\s*([\s\S]+)$/i);
    if (!m) throw new Error(`Invalid INSERT INTO: ${sql}`);
    const tableName = m[1].toLowerCase();
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table not found: ${tableName}`);

    const colNames = m[2] ? m[2].split(',').map(s => s.trim().toLowerCase()) : table.columns.map(c => c.name);
    const valuesStr = m[3].trim();

    // Split multiple value rows: (row1), (row2)
    const rowStrings = [];
    let depth = 0, current = '';
    for (let i = 0; i < valuesStr.length; i++) {
      const c = valuesStr[i];
      if (c === '(') {
        depth++;
        if (depth === 1) { current = ''; continue; }
      } else if (c === ')') {
        depth--;
        if (depth === 0) { rowStrings.push(current); current = ''; continue; }
      }
      if (depth > 0) current += c;
    }

    let inserted = 0;
    let lastId = null;

    for (const rStr of rowStrings) {
      const values = this.splitValues(rStr).map(v => this.parseLiteral(v));
      const row = {};

      // Defaults
      table.columns.forEach(col => {
        if (col.isAuto) {
          this.tableAutoInc[tableName] = (this.tableAutoInc[tableName] || 0) + 1;
          row[col.name] = this.tableAutoInc[tableName];
          lastId = row[col.name];
        } else if (col.defaultVal !== null) {
          row[col.name] = col.defaultVal;
        } else {
          row[col.name] = null;
        }
      });

      colNames.forEach((name, idx) => {
        if (idx < values.length) {
          const val = values[idx];
          if (val !== null && val !== undefined) {
            row[name] = val;
            const col = table.columns.find(c => c.name === name);
            if (col && col.isAuto && typeof val === 'number') {
              if (val > (this.tableAutoInc[tableName] || 0)) this.tableAutoInc[tableName] = val;
              lastId = val;
            }
          }
        }
      });

      // Constraint Validations
      for (const col of table.columns) {
        const val = row[col.name];
        if (col.notNull && (val === null || val === undefined)) {
          throw new Error(`NOT NULL constraint failed: ${tableName}.${col.name}`);
        }
        if (col.unique && val !== null) {
          const exists = table.rows.some(r => r[col.name] === val);
          if (exists) throw new Error(`UNIQUE constraint failed: ${tableName}.${col.name} (Value: ${val})`);
        }
        if (col.checkFn && val !== null && !col.checkFn(val, row)) {
          throw new Error(`CHECK constraint failed: ${tableName}.${col.name} (Value: ${val})`);
        }
      }

      // Foreign Key Validation
      for (const fk of table.foreignKeys) {
        const fkVal = row[fk.column];
        if (fkVal !== null && fkVal !== undefined) {
          const target = this.tables[fk.targetTable];
          if (target) {
            const match = target.rows.some(tr => tr[fk.targetCol] == fkVal);
            if (!match) throw new Error(`FOREIGN KEY constraint failed: ${tableName}.${fk.column} -> ${fk.targetTable}.${fk.targetCol}`);
          }
        }
      }

      table.rows.push(row);
      inserted++;
    }

    return { success: true, changes: inserted, lastInsertRowId: lastId };
  }

  execUpdate(sql) {
    const m = sql.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) throw new Error(`Invalid UPDATE: ${sql}`);
    const tableName = m[1].toLowerCase();
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table not found: ${tableName}`);

    const setPairs = this.splitValues(m[2]).map(p => {
      const eqIdx = p.indexOf('=');
      return { col: p.slice(0, eqIdx).trim().toLowerCase(), val: this.parseLiteral(p.slice(eqIdx + 1).trim()) };
    });

    const whereClause = m[3] ? m[3].trim() : null;
    let changes = 0;

    table.rows.forEach(row => {
      if (!whereClause || this.evalCondition(row, whereClause)) {
        setPairs.forEach(pair => {
          row[pair.col] = pair.val;
        });
        changes++;
      }
    });

    return { success: true, changes };
  }

  execDelete(sql) {
    const m = sql.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) throw new Error(`Invalid DELETE: ${sql}`);
    const tableName = m[1].toLowerCase();
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table not found: ${tableName}`);

    const whereClause = m[2] ? m[2].trim() : null;
    const toDelete = [];
    const remaining = [];

    table.rows.forEach(row => {
      if (!whereClause || this.evalCondition(row, whereClause)) {
        toDelete.push(row);
      } else {
        remaining.push(row);
      }
    });

    // Handle foreign key cascading
    toDelete.forEach(deletedRow => {
      Object.values(this.tables).forEach(otherTable => {
        otherTable.foreignKeys.forEach(fk => {
          if (fk.targetTable === tableName) {
            const targetVal = deletedRow[fk.targetCol];
            if (fk.onDelete === 'CASCADE') {
              otherTable.rows = otherTable.rows.filter(r => r[fk.column] !== targetVal);
            } else if (fk.onDelete === 'SET NULL') {
              otherTable.rows.forEach(r => {
                if (r[fk.column] === targetVal) r[fk.column] = null;
              });
            }
          }
        });
      });
    });

    const changes = toDelete.length;
    table.rows = remaining;
    return { success: true, changes };
  }

  // SELECT query executor with JOIN, WHERE, GROUP BY, ORDER BY, LIMIT
  query(sql, params = []) {
    sql = this.injectParams(sql.trim(), params).replace(/;+\s*$/, '');
    const m = sql.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?([\s\S]*)$/i);
    if (!m) throw new Error(`Invalid SELECT statement: ${sql}`);

    const selectCols = m[1].trim();
    const mainTable = m[2].toLowerCase();
    const mainAlias = (m[3] && !['WHERE', 'LEFT', 'INNER', 'JOIN', 'GROUP', 'ORDER', 'LIMIT'].includes(m[3].toUpperCase())) ? m[3].toLowerCase() : mainTable;
    let rest = m[4] || '';
    if (m[3] && ['WHERE', 'LEFT', 'INNER', 'JOIN', 'GROUP', 'ORDER', 'LIMIT'].includes(m[3].toUpperCase())) {
      rest = ' ' + m[3] + rest;
    }

    if (!this.tables[mainTable]) throw new Error(`Table not found: ${mainTable}`);

    // Parse JOINs
    let workingRows = this.tables[mainTable].rows.map(r => this.prefixRow(r, mainAlias));
    const joinRegex = /(LEFT|INNER)?\s*JOIN\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/gi;
    let joinMatch;

    while ((joinMatch = joinRegex.exec(rest)) !== null) {
      const isLeft = !joinMatch[1] || joinMatch[1].toUpperCase() === 'LEFT';
      const jTable = joinMatch[2].toLowerCase();
      const jAlias = joinMatch[3] ? joinMatch[3].toLowerCase() : jTable;
      const leftKey = joinMatch[4].toLowerCase();
      const rightKey = joinMatch[5].toLowerCase();

      const targetTable = this.tables[jTable];
      if (!targetTable) continue;

      const nextRows = [];
      workingRows.forEach(leftRow => {
        const matches = targetTable.rows.filter(rightRow => {
          const lVal = this.resolveJoinedCol(leftRow, leftKey);
          const rVal = rightRow[rightKey.split('.').pop()];
          return lVal !== null && lVal !== undefined && lVal == rVal;
        });

        if (matches.length > 0) {
          matches.forEach(mRow => {
            nextRows.push({ ...leftRow, ...this.prefixRow(mRow, jAlias) });
          });
        } else if (isLeft) {
          const nullRow = {};
          targetTable.columns.forEach(c => { nullRow[`${jAlias}.${c.name}`] = null; });
          nextRows.push({ ...leftRow, ...nullRow });
        }
      });
      workingRows = nextRows;
    }

    // Parse WHERE
    const whereMatch = rest.match(/WHERE\s+([\s\S]+?)(?=\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      const whereCond = whereMatch[1].trim();
      workingRows = workingRows.filter(r => this.evalCondition(r, whereCond));
    }

    // Parse GROUP BY & Aggregations
    const groupByMatch = rest.match(/GROUP\s+BY\s+([\s\S]+?)(?=\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (groupByMatch) {
      const groupCol = groupByMatch[1].trim().toLowerCase();
      const groups = {};
      workingRows.forEach(r => {
        const key = this.resolveJoinedCol(r, groupCol);
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });

      workingRows = Object.values(groups).map(gRows => {
        return this.computeProjection(gRows, selectCols);
      });
    } else {
      const hasAgg = /(COUNT|AVG|SUM|MIN|MAX)\s*\(/i.test(selectCols);
      if (hasAgg && workingRows.length > 0) {
        workingRows = [this.computeProjection(workingRows, selectCols)];
      } else if (hasAgg && workingRows.length === 0) {
        workingRows = [this.computeProjection([], selectCols)];
      } else {
        workingRows = workingRows.map(r => this.projectRow(r, selectCols));
      }
    }

    // Parse ORDER BY
    const orderMatch = rest.match(/ORDER\s+BY\s+([\s\S]+?)(?=\s+LIMIT|$)/i);
    if (orderMatch) {
      const orderExprs = orderMatch[1].split(',').map(s => s.trim());
      workingRows.sort((a, b) => {
        for (const expr of orderExprs) {
          const parts = expr.split(/\s+/);
          const col = parts[0].toLowerCase();
          const desc = parts[1] && parts[1].toUpperCase() === 'DESC';
          const aV = a[col] !== undefined ? a[col] : a[col.split('.').pop()];
          const bV = b[col] !== undefined ? b[col] : b[col.split('.').pop()];
          if (aV === bV) continue;
          if (aV === null || aV === undefined) return desc ? 1 : -1;
          if (bV === null || bV === undefined) return desc ? -1 : 1;
          const cmp = aV > bV ? 1 : -1;
          return desc ? -cmp : cmp;
        }
        return 0;
      });
    }

    // Parse LIMIT & OFFSET
    const limitMatch = rest.match(/LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      const offset = limitMatch[2] ? parseInt(limitMatch[2], 10) : 0;
      workingRows = workingRows.slice(offset, offset + limit);
    }

    return workingRows;
  }

  prefixRow(row, alias) {
    const out = {};
    Object.entries(row).forEach(([k, v]) => {
      out[`${alias}.${k}`] = v;
      out[k] = v; // Allow unqualified lookup
    });
    return out;
  }

  resolveJoinedCol(row, colKey) {
    if (row[colKey] !== undefined) return row[colKey];
    const bare = colKey.split('.').pop();
    if (row[bare] !== undefined) return row[bare];
    return null;
  }

  projectRow(row, selectCols) {
    if (selectCols.trim() === '*') {
      const bare = {};
      Object.keys(row).forEach(k => {
        if (!k.includes('.')) bare[k] = row[k];
      });
      return bare;
    }

    const res = {};
    const cols = this.splitValues(selectCols);
    cols.forEach(c => {
      const aliasMatch = c.match(/([\s\S]+?)\s+AS\s+([a-zA-Z0-9_]+)/i);
      const expr = (aliasMatch ? aliasMatch[1] : c).trim();
      const alias = (aliasMatch ? aliasMatch[2] : expr).trim().toLowerCase();

      if (expr.endsWith('.*')) {
        const prefix = expr.replace('.*', '');
        Object.keys(row).forEach(k => {
          if (k.startsWith(`${prefix}.`)) {
            res[k.replace(`${prefix}.`, '')] = row[k];
          }
        });
      } else {
        const val = this.resolveJoinedCol(row, expr.toLowerCase());
        res[alias] = val;
        if (!aliasMatch && alias.includes('.')) {
          const shortName = alias.split('.').pop();
          if (res[shortName] === undefined) {
            res[shortName] = val;
          }
        }
      }
    });
    return res;
  }

  computeProjection(rows, selectCols) {
    const res = {};
    const cols = this.splitValues(selectCols);
    cols.forEach(c => {
      const aliasMatch = c.match(/([\s\S]+?)\s+AS\s+([a-zA-Z0-9_]+)/i);
      const expr = (aliasMatch ? aliasMatch[1] : c).trim();
      const alias = (aliasMatch ? aliasMatch[2] : expr).trim().toLowerCase();

      // Aggregate: COUNT(*)
      if (/COUNT\s*\(\s*\*\s*\)/i.test(expr)) {
        res[alias] = rows.length;
      } else if (/COUNT\s*\(([^)]+)\)/i.test(expr)) {
        const col = expr.match(/COUNT\s*\(([^)]+)\)/i)[1].trim().toLowerCase();
        res[alias] = rows.filter(r => this.resolveJoinedCol(r, col) !== null).length;
      } else if (/AVG\s*\(([^)]+)\)/i.test(expr)) {
        const col = expr.match(/AVG\s*\(([^)]+)\)/i)[1].trim().toLowerCase();
        const vals = rows.map(r => Number(this.resolveJoinedCol(r, col))).filter(n => !isNaN(n));
        res[alias] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
      } else if (/SUM\s*\(([^)]+)\)/i.test(expr)) {
        const col = expr.match(/SUM\s*\(([^)]+)\)/i)[1].trim().toLowerCase();
        res[alias] = rows.map(r => Number(this.resolveJoinedCol(r, col))).filter(n => !isNaN(n)).reduce((a, b) => a + b, 0);
      } else if (rows.length > 0) {
        res[alias] = this.resolveJoinedCol(rows[0], expr.toLowerCase());
      } else {
        res[alias] = null;
      }
    });
    return res;
  }

  evalOperand(row, expr) {
    if (!expr) return null;
    expr = expr.trim();
    const lowerMatch = expr.match(/^LOWER\(([\s\S]+)\)$/i);
    if (lowerMatch) {
      const v = this.evalOperand(row, lowerMatch[1]);
      return v !== null && v !== undefined ? String(v).toLowerCase() : null;
    }
    const upperMatch = expr.match(/^UPPER\(([\s\S]+)\)$/i);
    if (upperMatch) {
      const v = this.evalOperand(row, upperMatch[1]);
      return v !== null && v !== undefined ? String(v).toUpperCase() : null;
    }
    if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
      return this.parseLiteral(expr);
    }
    if (expr.toUpperCase() === 'NULL') return null;
    if (expr.toUpperCase() === 'TRUE') return 1;
    if (expr.toUpperCase() === 'FALSE') return 0;
    if (!isNaN(Number(expr)) && expr !== '') return Number(expr);

    return this.resolveJoinedCol(row, expr.toLowerCase());
  }

  evalCondition(row, cond) {
    cond = cond.trim().replace(/;+\s*$/, '');

    // BETWEEN min AND max
    let betweenMatch = cond.match(/^([\s\S]+?)\s+BETWEEN\s+([\s\S]+?)\s+AND\s+([\s\S]+)$/i);
    if (betweenMatch) {
      const val = this.evalOperand(row, betweenMatch[1]);
      const min = this.evalOperand(row, betweenMatch[2]);
      const max = this.evalOperand(row, betweenMatch[3]);
      return val >= min && val <= max;
    }

    // Handle OR
    const orParts = cond.split(/\s+OR\s+(?![^(]*\))/i);
    if (orParts.length > 1) {
      return orParts.some(p => this.evalCondition(row, p));
    }

    // Handle AND
    const andParts = cond.split(/\s+AND\s+(?![^(]*\))/i);
    if (andParts.length > 1) {
      return andParts.every(p => this.evalCondition(row, p));
    }

    // Unparenthesize
    if (cond.startsWith('(') && cond.endsWith(')')) {
      return this.evalCondition(row, cond.slice(1, -1));
    }

    // IS NULL / IS NOT NULL
    let isNullMatch = cond.match(/^([\s\S]+?)\s+IS\s+(NOT\s+)?NULL$/i);
    if (isNullMatch) {
      const val = this.evalOperand(row, isNullMatch[1]);
      const isNull = val === null || val === undefined;
      return isNullMatch[2] ? !isNull : isNull;
    }

    // IN / NOT IN (...)
    let inMatch = cond.match(/^([\s\S]+?)(?:\s+(NOT))?\s+IN\s*\(([^)]+)\)$/i);
    if (inMatch) {
      const val = this.evalOperand(row, inMatch[1]);
      const inVals = this.splitValues(inMatch[3]).map(v => this.parseLiteral(v));
      const inside = inVals.includes(val);
      return inMatch[2] ? !inside : inside;
    }

    // LIKE '%text%'
    let likeMatch = cond.match(/^([\s\S]+?)\s+LIKE\s+'([^']*)'$/i);
    if (likeMatch) {
      const val = String(this.evalOperand(row, likeMatch[1]) || '').toLowerCase();
      const pattern = likeMatch[2].toLowerCase().replace(/%/g, '.*');
      return new RegExp(`^${pattern}$`, 's').test(val);
    }

    // Standard comparisons: =, !=, <>, >=, <=, >, <
    let cmpMatch = cond.match(/^([\s\S]+?)\s*(=|!=|<>|>=|<=|>|<)\s*([\s\S]+)$/);
    if (cmpMatch) {
      const leftVal = this.evalOperand(row, cmpMatch[1]);
      const op = cmpMatch[2];
      const rightVal = this.evalOperand(row, cmpMatch[3]);

      if (op === '=' || op === '==') return leftVal == rightVal;
      if (op === '!=' || op === '<>') return leftVal != rightVal;
      if (op === '>') return leftVal > rightVal;
      if (op === '<') return leftVal < rightVal;
      if (op === '>=') return leftVal >= rightVal;
      if (op === '<=') return leftVal <= rightVal;
    }

    return false;
  }

  buildCheckEvaluator(colName, expr) {
    return (val) => {
      const fakeRow = { [colName]: val };
      return this.evalCondition(fakeRow, expr.replace(new RegExp(`\\b${colName}\\b`, 'gi'), colName));
    };
  }

  parseLiteral(str) {
    if (!str) return null;
    str = str.trim();
    if (str.toUpperCase() === 'NULL') return null;
    if (str.toUpperCase() === 'TRUE') return 1;
    if (str.toUpperCase() === 'FALSE') return 0;
    if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
      return str.slice(1, -1).replace(/''/g, "'");
    }
    if (!isNaN(Number(str))) return Number(str);
    return str;
  }

  splitValues(str) {
    const list = [];
    let depth = 0, current = '', inQuote = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (c === "'" || c === '"') inQuote = !inQuote;
      if (!inQuote) {
        if (c === '(') depth++;
        else if (c === ')') depth--;
      }
      if (c === ',' && depth === 0 && !inQuote) {
        list.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    if (current.trim()) list.push(current.trim());
    return list;
  }

  // Export clean SQL dump
  exportDump() {
    let out = `-- GrievanceTrack SQL Relational Database Dump\n-- Generated: ${new Date().toISOString()}\n\n`;
    Object.values(this.tables).forEach(t => {
      out += `DROP TABLE IF EXISTS ${t.name};\n`;
      const cols = t.columns.map(c => `  ${c.rawDef}`).join(',\n');
      out += `CREATE TABLE IF NOT EXISTS ${t.name} (\n${cols}\n);\n\n`;
      if (t.rows.length > 0) {
        const colNames = t.columns.map(c => c.name).join(', ');
        t.rows.forEach(r => {
          const vals = t.columns.map(c => {
            const v = r[c.name];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return v;
            return `'${String(v).replace(/'/g, "''")}'`;
          }).join(', ');
          out += `INSERT INTO ${t.name} (${colNames}) VALUES (${vals});\n`;
        });
        out += '\n';
      }
    });
    return out;
  }
}

// Global engine instance
if (typeof window !== 'undefined') {
  window.SQLEngine = SQLEngine;
}
