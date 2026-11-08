import { Logger } from '@nestjs/common';

// Keeps the test output readable: services log warnings on purpose in error scenarios
Logger.overrideLogger(false);
