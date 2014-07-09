keepass.io
==========

[![License](http://img.shields.io/badge/license-GPLv3-blue.svg)](https://github.com/NeoXiD/keepass.io/blob/development/LICENSE.md)
[![Build Status](http://img.shields.io/travis/NeoXiD/keepass.io/development.svg)](http://travis-ci.org/NeoXiD/keepass.io)
[![Dependency Status](http://img.shields.io/david/NeoXiD/keepass.io.svg)](https://david-dm.org/NeoXiD/keepass.io)
[![Coverage Status](http://img.shields.io/coveralls/NeoXiD/keepass.io/development.svg)](https://coveralls.io/r/NeoXiD/keepass.io?branch=development)
[![NPM version](http://img.shields.io/npm/v/keepass.io.svg)](http://badge.fury.io/js/keepass.io)
[![Gittip](http://img.shields.io/gittip/NeoXiD.svg)](https://www.gittip.com/NeoXiD)


*keepass.io* is a Node.js library for reading and writing KeePass databases. Please note that currently only the newest database version, called KDBX, is supported. Features include so far:

- **Password and/or Keyfile credentials**: keepass.io supports both of the most common used credential types for KeePass databases.
- **Powerful API**: This library offers you a powerful API, which even allows you raw access to the database, so even unsupported third-party fields can be modified.
- **Joyfully simple and flexible**: I've built keepass.io to be easily understandable and a joy to use. It's built with JavaScript and tries to provide a solid foundation for modifying KDBX databases.

-
**Note**: *keepass.io is currently under active development. As such, while this library is well-tested, the API might change at anytime. Consider using it in production applications only if you're comfortable following a changelog and updating your usage accordingly.*


Copyright
---------
Copyright &copy; 2013-2014 Pascal Mathis. All rights reserved.