const { ApolloServer, gql } = require("apollo-server");
const { createIntl } = require("@formatjs/intl");
const GraphQLJSON = require("graphql-type-json");
const semver = require("semver");

const initializeIntl = (locale) => {
  const messages = require(`./messages.${locale}.json`);

  return createIntl({
    locale,
    messages
  });
};

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  scalar JSON

  type Query {
    hello: String!
    currentDate: String!
    currentTime: String!
    price: String!
    allTogether: String!
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    hello: (root, args, context) => {
      // This platform and version check would ideally come from
      // an experimentation service, just an example using headers
      if (context.platform === "WEB" && semver.gt(context.version, "2.0.0")) {
        return context.intl.formatMessage(
          {
            id: "greetings",
            defaultMessage: "Greetings, {name}!"
          },
          { name: "Jeff" }
        );
      }
      return context.intl.formatMessage(
        {
          id: "hello",
          defaultMessage: "Hello, {name}"
        },
        { name: "Jeff" }
      );
    },
    currentDate: (parent, args, context) => {
      return context.intl.formatDate(Date.now());
    },
    currentTime: (parent, args, context) => {
      return context.intl.formatTime(Date.now());
    },
    price: (parent, args, context) => {
      return context.intl.formatNumber(1000, {
        style: "currency",
        currency: context.currency
      });
    },
    allTogether: (parent, args, context) => {
      return context.intl.formatMessage(
        {
          id: "together",
          defaultMessage:
            "Hello, {name}! On {date} at {time} your order total was {amount}."
        },
        {
          name: "Jeff",
          date: context.intl.formatDate(Date.now()),
          time: context.intl.formatTime(Date.now()),
          amount: context.intl.formatNumber(1000, {
            style: "currency",
            currency: context.currency
          })
        }
      );
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    // Locales: en-US, fr-CA, de-DE
    locale: req.headers.locale,
    // Currencies: USD, CAD, EUR
    currency: req.headers.currency,
    intl: initializeIntl(req.headers.locale),
    platform: req.headers.platform,
    version: req.headers.version
  })
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
