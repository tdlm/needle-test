"""Server-side demo tools executed by POST /run."""

from typing import Literal

import needle

SERVER_TOOLS = []


@needle.tool
def get_weather(city: str):
    """Get the current weather for a city."""
    return {"city": city, "temp_c": 22, "sky": "partly cloudy"}


@needle.tool
def set_thermostat(temperature: int, mode: Literal["heat", "cool", "auto"] = "auto"):
    """Set the thermostat target temperature and mode."""
    return {"temperature": temperature, "mode": mode, "status": "ok"}


@needle.tool
def send_message(recipient: str, message: str):
    """Send a text message to a recipient."""
    return {"recipient": recipient, "message": message, "sent": True}


SERVER_TOOLS = [get_weather, set_thermostat, send_message]
