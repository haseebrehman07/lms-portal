from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.config import settings
from app.database import Base

# Import every model module so Alembic's autogenerate can see all tables.
# If a model isn't imported here, autogenerate will silently ignore it.
from app.models.user import User  # noqa
from app.models.course import Course  # noqa
from app.models.category import Category  # noqa
from app.models.enrollment import Enrollment, LessonProgress  # noqa
from app.models.enrollment_request import EnrollmentRequest  # noqa
from app.models.lesson import Lesson  # noqa
from app.models.Module import Module  # noqa
from app.models.quiz import Quiz  # noqa
from app.models.assignment import Assignment  # noqa
from app.models.announcement import Announcement  # noqa
from app.models.certificate import Certificate  # noqa
from app.models.token_blacklist import TokenBlacklist  # noqa
from app.models.certificate_request import CertificateRequest  # noqa
from app.models.Attendence import Attendance 

# this is the Alembic Config object, which provides access to values
# within the .ini file in use.
config = context.config

# Override the sqlalchemy.url from alembic.ini with the real DB URL from
# our app's settings (.env), so Alembic always targets the same database
# the running application actually connects to.
config.set_main_option("sqlalchemy.url", settings.database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well. By skipping the Engine
    creation we don't even need a DBAPI to be available.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a
    connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()