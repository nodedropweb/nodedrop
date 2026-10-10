# Store the initial ZDOTDIR value
NODEDROP_ZDOTDIR="$ZDOTDIR"

# Source the original zshenv
[ -f ~/.zshenv ] && source ~/.zshenv

# Detect if ZDOTDIR has changed
if [ "$ZDOTDIR" != "$NODEDROP_ZDOTDIR" ]; then
  # If changed, manually source your custom zshrc from the original NODEDROP_ZDOTDIR
  [ -f "$NODEDROP_ZDOTDIR/.zshrc" ] && source "$NODEDROP_ZDOTDIR/.zshrc"
fi