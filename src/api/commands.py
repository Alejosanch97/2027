import click
from api.models import db
from api.seed import ensure_seed

"""
Comandos de consola. Ejemplo: `pipenv run flask seed`
"""


def setup_commands(app):

    @app.cli.command("seed")
    def seed():
        """Crea el usuario 1ALE con el Plan Maestro 2027 si la base está vacía."""
        print("Plan sembrado." if ensure_seed() else "Ya hay usuarios: no se tocó nada.")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        ensure_seed()

    @app.cli.command("reset-plan")
    @click.confirmation_option(prompt="Esto borra TODOS los datos. ¿Seguro?")
    def reset_plan():
        """Borra todo y vuelve a sembrar el plan inicial."""
        db.drop_all()
        db.create_all()
        ensure_seed()
        print("Base reiniciada.")
