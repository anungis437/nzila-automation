"""
Logging configuration for Nzila Migration Orchestration System.

Provides structured logging with different handlers for console and file output.
Supports log levels, colored output, and JSON formatting for production.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import colorlog
from pythonjsonlogger import jsonlogger


class MigrationLogger:
    """Centralized logging manager for the migration system."""
    
    _loggers = {}
    _log_level = logging.INFO
    _log_dir = None
    
    @classmethod
    def setup(cls, log_level: str = "INFO", log_dir: Optional[Path] = None):
        """
        Set up global logging configuration.
        
        Args:
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_dir: Directory for log files (None = no file logging)
        """
        cls._log_level = getattr(logging, log_level.upper())
        cls._log_dir = log_dir
        
        if cls._log_dir:
            cls._log_dir.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:
        """
        Get or create a logger with the given name.
        
        Args:
            name: Logger name (typically __name__ of the module)
            
        Returns:
            Configured logger instance
        """
        if name in cls._loggers:
            return cls._loggers[name]
        
        logger = logging.getLogger(name)
        logger.setLevel(cls._log_level)
        logger.propagate = False
        
        # Remove existing handlers
        logger.handlers = []
        
        # Console handler with colored output
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(cls._log_level)
        
        console_formatter = colorlog.ColoredFormatter(
            "%(log_color)s%(levelname)-8s%(reset)s %(blue)s%(name)s%(reset)s - %(message)s",
            datefmt=None,
            reset=True,
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            }
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        # File handler with JSON formatting (if log_dir specified)
        if cls._log_dir:
            log_file = cls._log_dir / f"migration_{datetime.now().strftime('%Y%m%d')}.log"
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(cls._log_level)
            
            json_formatter = jsonlogger.JsonFormatter(
                '%(asctime)s %(name)s %(levelname)s %(message)s',
                timestamp=True
            )
            file_handler.setFormatter(json_formatter)
            logger.addHandler(file_handler)
        
        cls._loggers[name] = logger
        return logger


# Context managers for operation logging
class LogOperation:
    """Context manager for logging operation start/end with timing."""
    
    def __init__(self, logger: logging.Logger, operation: str, **context):
        self.logger = logger
        self.operation = operation
        self.context = context
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.now()
        context_str = " ".join(f"{k}={v}" for k, v in self.context.items())
        self.logger.info(f"Starting: {self.operation} {context_str}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.now() - self.start_time).total_seconds()
        
        if exc_type is None:
            self.logger.info(f"Completed: {self.operation} (took {duration:.2f}s)")
        else:
            self.logger.error(
                f"Failed: {self.operation} (took {duration:.2f}s) - {exc_type.__name__}: {exc_val}"
            )
        
        return False  # Don't suppress exceptions


class LogRetry:
    """Decorator for logging retry attempts."""
    
    def __init__(self, logger: logging.Logger, max_retries: int = 3, delay: float = 1.0):
        self.logger = logger
        self.max_retries = max_retries
        self.delay = delay
    
    def __call__(self, func):
        import time
        from functools import wraps
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(1, self.max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < self.max_retries:
                        self.logger.warning(
                            f"Retry {attempt}/{self.max_retries} for {func.__name__}: {e}"
                        )
                        time.sleep(self.delay * attempt)  # Exponential backoff
                    else:
                        self.logger.error(
                            f"All {self.max_retries} retries failed for {func.__name__}: {e}"
                        )
            
            raise last_exception
        
        return wrapper


# Initialize default logger
MigrationLogger.setup(log_level="INFO")
default_logger = MigrationLogger.get_logger("migration")
