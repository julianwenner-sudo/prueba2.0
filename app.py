import os
from datetime import datetime
from typing import List

from flask import (
    Flask,
    redirect,
    render_template,
    request,
    session,
    url_for,
    flash,
)
from flask_sqlalchemy import SQLAlchemy

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "offers.db")

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), nullable=True)

    offers = db.relationship("Offer", back_populates="client", cascade="all, delete")

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"Client(id={self.id!r}, name={self.name!r})"


class Offer(db.Model):
    __tablename__ = "offers"

    id = db.Column(db.Integer, primary_key=True)
    offer_number = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.Date, nullable=False)
    valid_until = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="borrador")

    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=False)
    client = db.relationship("Client", back_populates="offers")

    @property
    def margin(self) -> float:
        return self.price - self.cost

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"Offer(id={self.id!r}, number={self.offer_number!r})"


def init_db() -> None:
    """Create the database if it does not exist."""
    if not os.path.exists(DB_PATH):
        db.create_all()
        db.session.commit()


def parse_date(date_str: str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None


@app.before_request
def ensure_database_exists():
    init_db()


@app.route("/", methods=["GET", "POST"])
def dashboard():
    if request.method == "POST":
        selected_columns = request.form.getlist("columns")
        session["dashboard_columns"] = selected_columns
        flash("Preferencias del dashboard actualizadas", "success")
        return redirect(url_for("dashboard", **request.args))

    selected_columns: List[str] = session.get(
        "dashboard_columns",
        [
            "offer_number",
            "client",
            "price",
            "cost",
            "margin",
            "created_at",
            "valid_until",
            "status",
        ],
    )

    status_filter = request.args.getlist("status")
    created_from = parse_date(request.args.get("created_from", ""))
    created_to = parse_date(request.args.get("created_to", ""))
    valid_from = parse_date(request.args.get("valid_from", ""))
    valid_to = parse_date(request.args.get("valid_to", ""))
    client_id = request.args.get("client_id")

    offers_query = Offer.query.join(Client)

    if status_filter:
        offers_query = offers_query.filter(Offer.status.in_(status_filter))

    if created_from:
        offers_query = offers_query.filter(Offer.created_at >= created_from)
    if created_to:
        offers_query = offers_query.filter(Offer.created_at <= created_to)

    if valid_from:
        offers_query = offers_query.filter(Offer.valid_until >= valid_from)
    if valid_to:
        offers_query = offers_query.filter(Offer.valid_until <= valid_to)

    if client_id:
        offers_query = offers_query.filter(Offer.client_id == client_id)

    offers = offers_query.order_by(Offer.created_at.desc()).all()
    clients = Client.query.order_by(Client.name.asc()).all()

    statuses = ["borrador", "enviada", "ganada", "perdida"]

    totals = {
        "count": len(offers),
        "value": sum(offer.price for offer in offers),
        "cost": sum(offer.cost for offer in offers),
    }
    totals["margin"] = totals["value"] - totals["cost"]

    status_summary = {status: 0 for status in statuses}
    for offer in offers:
        status_summary[offer.status] = status_summary.get(offer.status, 0) + 1

    return render_template(
        "dashboard.html",
        offers=offers,
        clients=clients,
        statuses=statuses,
        selected_columns=selected_columns,
        totals=totals,
        status_summary=status_summary,
    )


@app.route("/clients", methods=["GET", "POST"])
def manage_clients():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip() or None

        if not name:
            flash("El nombre del cliente es obligatorio", "error")
            return redirect(url_for("manage_clients"))

        existing = Client.query.filter_by(name=name).first()
        if existing:
            flash("El cliente ya existe", "error")
        else:
            client = Client(name=name, email=email)
            db.session.add(client)
            db.session.commit()
            flash("Cliente creado exitosamente", "success")
        return redirect(url_for("manage_clients"))

    clients = Client.query.order_by(Client.name.asc()).all()
    return render_template("clients.html", clients=clients)


@app.route("/offers/new", methods=["GET", "POST"])
def create_offer():
    clients = Client.query.order_by(Client.name.asc()).all()

    if request.method == "POST":
        offer_number = request.form.get("offer_number", "").strip()
        price = request.form.get("price", "").strip()
        cost = request.form.get("cost", "").strip()
        created_at = parse_date(request.form.get("created_at", ""))
        valid_until = parse_date(request.form.get("valid_until", ""))
        status = request.form.get("status", "borrador")
        client_id = request.form.get("client_id")
        new_client_name = request.form.get("new_client_name", "").strip()
        new_client_email = request.form.get("new_client_email", "").strip() or None

        errors: List[str] = []

        if not offer_number:
            errors.append("El número de oferta es obligatorio")
        else:
            existing_offer = Offer.query.filter_by(offer_number=offer_number).first()
            if existing_offer:
                errors.append("Ya existe una oferta con ese número")

        try:
            price_value = float(price)
        except ValueError:
            errors.append("El precio debe ser un número")
            price_value = None

        try:
            cost_value = float(cost)
        except ValueError:
            errors.append("El costo debe ser un número")
            cost_value = None

        if created_at is None:
            errors.append("La fecha de creación es inválida o está vacía")
        if valid_until is None:
            errors.append("La fecha de validez es inválida o está vacía")
        elif created_at and created_at > valid_until:
            errors.append("La fecha de validez debe ser posterior a la fecha de creación")

        client = None
        if new_client_name:
            client = Client(name=new_client_name, email=new_client_email)
            db.session.add(client)
            db.session.flush()
        elif client_id:
            client = Client.query.get(client_id)

        if client is None:
            errors.append("Debe seleccionar o crear un cliente")

        if errors:
            for message in errors:
                flash(message, "error")
            db.session.rollback()
            return render_template("create_offer.html", clients=clients, statuses=["borrador", "enviada", "ganada", "perdida"])

        offer = Offer(
            offer_number=offer_number,
            price=price_value,
            cost=cost_value,
            created_at=created_at,
            valid_until=valid_until,
            status=status,
            client=client,
        )
        db.session.add(offer)
        db.session.commit()
        flash("Oferta creada exitosamente", "success")
        return redirect(url_for("dashboard"))

    return render_template(
        "create_offer.html",
        clients=clients,
        statuses=["borrador", "enviada", "ganada", "perdida"],
    )


@app.template_filter("date_format")
def format_date(value):
    if value is None:
        return ""
    return value.strftime("%Y-%m-%d")


@app.template_filter("currency")
def format_currency(value):
    if value is None:
        return "-"
    return f"${value:,.2f}"


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
