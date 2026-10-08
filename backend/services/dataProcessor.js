const logger = require('../utils/logger');

class DataProcessor {
  cleanText(text) {
    if (!text) return '';

    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/&#39;/g, "'") // Replace &#39;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  parsePrice(priceString) {
    if (!priceString) return null;

    // Remove currency symbols and extract numbers
    const cleaned = priceString.replace(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    const price = parseFloat(normalized);

    return isNaN(price) ? null : price;
  }

  parseDate(dateString) {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch (error) {
      logger.warn(`Failed to parse date: ${dateString}`);
      return null;
    }
  }

  parseNumber(numString) {
    if (!numString) return null;

    const cleaned = String(numString).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);

    return isNaN(num) ? null : num;
  }

  cleanData(data, schema = {}) {
    if (Array.isArray(data)) {
      return data.map(item => this.cleanData(item, schema));
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const cleaned = {};

    for (const [key, value] of Object.entries(data)) {
      const fieldType = schema[key]?.type || 'text';

      switch (fieldType) {
        case 'text':
          cleaned[key] = this.cleanText(value);
          break;
        case 'price':
          cleaned[key] = this.parsePrice(value);
          break;
        case 'number':
          cleaned[key] = this.parseNumber(value);
          break;
        case 'date':
          cleaned[key] = this.parseDate(value);
          break;
        case 'url':
          cleaned[key] = this.cleanUrl(value);
          break;
        default:
          cleaned[key] = value;
      }
    }

    return cleaned;
  }

  cleanUrl(url) {
    if (!url) return null;

    try {
      // Remove whitespace and validate
      const cleaned = url.trim();
      new URL(cleaned); // Validate URL
      return cleaned;
    } catch (error) {
      logger.warn(`Invalid URL: ${url}`);
      return null;
    }
  }

  validate(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check required
      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }

      // Check type
      if (value && rules.type) {
        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        }
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
      }

      // Check min/max for numbers
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be >= ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be <= ${rules.max}`);
        }
      }

      // Check length for strings
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
      }

      // Check pattern
      if (value && rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          errors.push(`${field} does not match required pattern`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  deduplicate(data, key = 'url') {
    if (!Array.isArray(data)) return data;

    const seen = new Set();
    const unique = [];

    for (const item of data) {
      const identifier = typeof item === 'object' ? item[key] : item;

      if (!seen.has(identifier)) {
        seen.add(identifier);
        unique.push(item);
      }
    }

    logger.info(`Deduplicated: ${data.length} -> ${unique.length} (removed ${data.length - unique.length})`);

    return unique;
  }

  transform(data, transformations) {
    if (Array.isArray(data)) {
      return data.map(item => this.transform(item, transformations));
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const transformed = { ...data };

    for (const [field, transformation] of Object.entries(transformations)) {
      if (typeof transformation === 'function') {
        transformed[field] = transformation(data[field], data);
      }
    }

    return transformed;
  }

  aggregate(data, groupBy, aggregations) {
    if (!Array.isArray(data)) return data;

    const groups = {};

    // Group data
    for (const item of data) {
      const key = item[groupBy];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    // Apply aggregations
    const results = [];
    for (const [key, items] of Object.entries(groups)) {
      const result = { [groupBy]: key };

      for (const [field, aggType] of Object.entries(aggregations)) {
        const values = items.map(item => item[field]).filter(v => v !== null && v !== undefined);

        switch (aggType) {
          case 'sum':
            result[field] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[field] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'min':
            result[field] = Math.min(...values);
            break;
          case 'max':
            result[field] = Math.max(...values);
            break;
          case 'count':
            result[field] = values.length;
            break;
          default:
            result[field] = values;
        }
      }

      results.push(result);
    }

    return results;
  }

  filter(data, conditions) {
    if (!Array.isArray(data)) return data;

    return data.filter(item => {
      for (const [field, condition] of Object.entries(conditions)) {
        const value = item[field];

        if (condition.equals !== undefined && value !== condition.equals) {
          return false;
        }
        if (condition.notEquals !== undefined && value === condition.notEquals) {
          return false;
        }
        if (condition.greaterThan !== undefined && value <= condition.greaterThan) {
          return false;
        }
        if (condition.lessThan !== undefined && value >= condition.lessThan) {
          return false;
        }
        if (condition.contains !== undefined && !String(value).includes(condition.contains)) {
          return false;
        }
      }
      return true;
    });
  }
}

module.exports = new DataProcessor();
