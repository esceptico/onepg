const Ajv = require('ajv');

const resumeSchema = {
  type: 'object',
  required: ['personal', 'summary', 'experience', 'education', 'skills'],
  additionalProperties: false,
  properties: {
    personal: {
      type: 'object',
      required: ['name'],
      additionalProperties: false,
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', default: '' },
        github: { type: 'string', default: '' },
        linkedin: { type: 'string', default: '' },
        phone: { type: 'string', default: '' },
        personal_site: { type: 'string', default: '' },
        location: { type: 'string', default: '' },
      },
    },
    summary: { type: 'string', minLength: 1 },
    experience: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['company', 'roles'],
        additionalProperties: false,
        properties: {
          company: { type: 'string', minLength: 1 },
          roles: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['title', 'dates', 'bullets'],
              additionalProperties: false,
              properties: {
                title: { type: 'string', minLength: 1 },
                dates: {
                  type: 'object',
                  required: ['start', 'end'],
                  additionalProperties: false,
                  properties: {
                    start: { type: 'string', minLength: 1 },
                    end: { type: 'string', minLength: 1 },
                  },
                },
                bullets: {
                  type: 'array',
                  items: {
                    oneOf: [
                      { type: 'string' },
                      {
                        type: 'object',
                        required: ['text'],
                        additionalProperties: false,
                        properties: {
                          text: { type: 'string', minLength: 1 },
                          tags: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'dates', 'description', 'bullets'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          dates: {
            type: 'object',
            required: ['start', 'end'],
            additionalProperties: false,
            properties: {
              start: { type: 'string', minLength: 1 },
              end: { type: 'string', minLength: 1 },
            },
          },
          description: { type: 'string', minLength: 1 },
          bullets: {
            type: 'array',
            items: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  required: ['text'],
                  additionalProperties: false,
                  properties: {
                    text: { type: 'string', minLength: 1 },
                    tags: { type: 'array', items: { type: 'string' } },
                  },
                },
              ],
            },
          },
          links: {
            type: 'object',
            additionalProperties: false,
            properties: {
              github: { type: 'string', default: '' },
              demo: { type: 'string', default: '' },
              paper: { type: 'string', default: '' },
              website: { type: 'string', default: '' },
            },
            default: {},
          },
        },
      },
      default: [],
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        required: ['institution', 'degree', 'dates'],
        additionalProperties: false,
        properties: {
          institution: { type: 'string', minLength: 1 },
          degree: { type: 'string', minLength: 1 },
          dates: {
            type: 'object',
            required: ['start', 'end'],
            additionalProperties: false,
            properties: {
              start: { type: 'string', minLength: 1 },
              end: { type: 'string', minLength: 1 },
            },
          },
          bullets: {
            type: 'array',
            items: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  required: ['text'],
                  additionalProperties: false,
                  properties: {
                    text: { type: 'string', minLength: 1 },
                    tags: { type: 'array', items: { type: 'string' }, default: [] },
                  },
                },
              ],
            },
            default: [],
          },
        },
      },
    },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        required: ['category', 'items'],
        additionalProperties: false,
        properties: {
          category: { type: 'string', minLength: 1 },
          items: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' },
          },
        },
      },
    },
  },
};

const ajv = new Ajv({ useDefaults: true, allErrors: true, strict: false });
const validate = ajv.compile(resumeSchema);

function validateResume(data) {
  const valid = validate(data);
  if (!valid) {
    const errors = validate.errors
      .map((e) => {
        const path = e.instancePath || '/';
        return `  ${path}: ${e.message}`;
      })
      .join('\n');
    throw new Error(`Invalid resume data:\n${errors}`);
  }
  return data;
}

module.exports = { validateResume };
